"use server";

import { z } from "zod";
import {
  issueToken,
  verifyCode,
  verifyToken,
  CODE_TTL_MINUTES,
} from "@/lib/auth-tokens";
import { updatePassword } from "@/lib/auth-credentials";
import { sendEmail } from "@/lib/email/send";
import { ResetPassword } from "@/lib/email/templates/reset-password";
import { ResetComplete } from "@/lib/email/templates/reset-complete";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { env } from "@/lib/env";
import { rateLimit, rateLimitByIp } from "@/lib/rate-limit";
import { headers } from "next/headers";

/**
 * Builds the public origin (scheme://host) for the current request from proxy
 * headers, so reset links point at wherever the app is actually served —
 * localhost in dev, the deployed domain in prod. Falls back to env.SITE_URL.
 */
async function getRequestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return env.SITE_URL;
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

const emailSchema = z.string().trim().email("Enter a valid email address.");

const TEN_MIN = 10 * 60_000;
const THROTTLED = "Too many requests. Please wait a few minutes and try again.";

/**
 * Issues a reset token and emails the link + code, but only for accounts that
 * have a password (credentials users). No-ops silently otherwise so the caller
 * can always report success without leaking which emails are registered.
 */
async function sendResetEmail(email: string): Promise<void> {
  await connectDB();
  const user = await User.findOne({ email: email.toLowerCase() })
    .select("+password")
    .lean();
  if (!user?.password) return;

  const { code, token } = await issueToken(email, "password-reset");
  const origin = await getRequestOrigin();
  const resetUrl = `${origin}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Reset your PGpoetry password",
    react: ResetPassword({ code, resetUrl, expiresMinutes: CODE_TTL_MINUTES }),
    devPreview: `reset code: ${code} · link: ${resetUrl}`,
  });
}

export type RequestResetState =
  | { status: "idle" }
  | { status: "error"; error: string }
  // Always returned on a well-formed request, whether or not the account exists.
  | { status: "sent" };

/**
 * Sends a reset email (magic link + 6-digit code) if the address has a
 * credentials account. Always reports "sent" so the form can't be used to
 * enumerate which emails are registered.
 */
export async function requestPasswordResetAction(
  _prev: RequestResetState,
  formData: FormData,
): Promise<RequestResetState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) {
    return { status: "error", error: email.error.issues[0]?.message ?? "Invalid email." };
  }

  // Throttle per IP and per target inbox before sending.
  const byIp = await rateLimitByIp("reset-request", 3, TEN_MIN);
  const byEmail = rateLimit(
    `reset-request:email:${email.data.toLowerCase()}`,
    3,
    TEN_MIN,
  );
  if (!byIp.success || !byEmail.success) {
    return { status: "error", error: THROTTLED };
  }

  await sendResetEmail(email.data);
  return { status: "sent" };
}

/** Re-sends a reset email (used by the "resend" button on the reset page). */
export async function resendPasswordResetAction(
  _prev: RequestResetState,
  formData: FormData,
): Promise<RequestResetState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { status: "error", error: "Invalid email." };

  const byIp = await rateLimitByIp("reset-request", 3, TEN_MIN);
  const byEmail = rateLimit(
    `reset-request:email:${email.data.toLowerCase()}`,
    3,
    TEN_MIN,
  );
  if (!byIp.success || !byEmail.success) {
    return { status: "error", error: THROTTLED };
  }

  await sendResetEmail(email.data);
  return { status: "sent" };
}

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128);
const codeSchema = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code.");

export type ResetState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "success" };

/**
 * Completes a reset. Accepts EITHER a magic-link token OR (email + code), then
 * sets the new password. The reset secret is single-use — verifying it here
 * consumes it.
 */
export async function resetPasswordAction(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  // Cap reset attempts per IP (complements the per-token attempt cap).
  const limited = await rateLimitByIp("reset-submit", 10, TEN_MIN);
  if (!limited.success) {
    return { status: "error", error: THROTTLED };
  }

  const password = passwordSchema.safeParse(formData.get("password"));
  if (!password.success) {
    return {
      status: "error",
      error: password.error.issues[0]?.message ?? "Invalid password.",
    };
  }

  const token = formData.get("token");
  const verify =
    typeof token === "string" && token.length > 0
      ? await verifyToken(token)
      : await verifyViaCode(formData);

  if (!verify.ok) return { status: "error", error: verify.error };

  const updated = await updatePassword(verify.identifier, password.data);
  if (!updated) {
    return { status: "error", error: "We couldn't find that account." };
  }

  // Confirmation that the reset succeeded. Fire-and-forget.
  void sendEmail({
    to: verify.identifier,
    subject: "Your PGpoetry password was reset",
    react: ResetComplete(),
    devPreview: "reset complete notice",
  });

  return { status: "success" };
}

async function verifyViaCode(formData: FormData) {
  const email = emailSchema.safeParse(formData.get("email"));
  const code = codeSchema.safeParse(formData.get("code"));
  if (!email.success || !code.success) {
    return { ok: false as const, error: "Enter your email and the 6-digit code." };
  }
  return verifyCode(email.data, "password-reset", code.data);
}
