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
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { env } from "@/lib/env";

const emailSchema = z.string().trim().email("Enter a valid email address.");

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

  await connectDB();
  const user = await User.findOne({ email: email.data.toLowerCase() })
    .select("+password")
    .lean();

  // Only send to accounts that actually have a password (credentials users).
  // OAuth-only accounts have nothing to reset.
  if (user?.password) {
    const { code, token } = await issueToken(email.data, "password-reset");
    const resetUrl = `${env.SITE_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: email.data,
      subject: "Reset your PGpoetry password",
      react: ResetPassword({
        code,
        resetUrl,
        expiresMinutes: CODE_TTL_MINUTES,
      }),
      devPreview: `reset code: ${code} · link: ${resetUrl}`,
    });
  }

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
