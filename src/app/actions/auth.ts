"use server";

import { z } from "zod";
import { registerUser } from "@/lib/auth-credentials";
import { issueToken, verifyCode, CODE_TTL_MINUTES } from "@/lib/auth-tokens";
import { sendEmail } from "@/lib/email/send";
import { VerifyEmail } from "@/lib/email/templates/verify-email";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { rateLimit, rateLimitByIp } from "@/lib/rate-limit";

const TEN_MIN = 10 * 60_000;

/** Generic message shown when an email-sending action is throttled. */
const THROTTLED = "Too many requests. Please wait a few minutes and try again.";

const signupSchema = z.object({
  name: z.string().trim().min(1, "Tell us your name.").max(80),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(24, "Username must be 24 characters or fewer.")
    .regex(/^[a-z0-9_]+$/i, "Use letters, numbers, and underscores only."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128),
});

export type SignupState =
  | { status: "idle" }
  | { status: "error"; error: string }
  // Account created; client should route to /verify-email for this address.
  | { status: "verify"; email: string };

/** Sends a fresh email-verification OTP to the given address. */
async function sendVerificationCode(email: string): Promise<void> {
  const { code } = await issueToken(email, "email-verify");
  await sendEmail({
    to: email,
    subject: "Verify your PGpoetry email",
    react: VerifyEmail({ code, expiresMinutes: CODE_TTL_MINUTES }),
    devPreview: `verify code: ${code}`,
  });
}

export async function signupAction(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  // Throttle account creation per IP before doing any work.
  const limited = await rateLimitByIp("signup", 5, TEN_MIN);
  if (!limited.success) {
    return { status: "error", error: THROTTLED };
  }

  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      error: parsed.error.issues[0]?.message ?? "Please check your details.",
    };
  }

  const result = await registerUser(parsed.data);
  if (!result.ok) {
    return { status: "error", error: result.error };
  }

  await sendVerificationCode(parsed.data.email);
  return { status: "verify", email: parsed.data.email.toLowerCase() };
}

const emailSchema = z.string().trim().email("Enter a valid email address.");
const codeSchema = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code.");

export type VerifyEmailState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "success" }
  | { status: "resent" };

/** Validates the OTP and marks the account's email as verified. */
export async function verifyEmailAction(
  _prev: VerifyEmailState,
  formData: FormData,
): Promise<VerifyEmailState> {
  // Cap code-guessing attempts per IP (complements the per-token attempt cap).
  const limited = await rateLimitByIp("verify-email", 10, TEN_MIN);
  if (!limited.success) {
    return { status: "error", error: THROTTLED };
  }

  const email = emailSchema.safeParse(formData.get("email"));
  const code = codeSchema.safeParse(formData.get("code"));

  if (!email.success) return { status: "error", error: "Invalid email." };
  if (!code.success) {
    return { status: "error", error: code.error.issues[0]?.message ?? "Invalid code." };
  }

  const result = await verifyCode(email.data, "email-verify", code.data);
  if (!result.ok) return { status: "error", error: result.error };

  await connectDB();
  await User.updateOne(
    { email: email.data.toLowerCase() },
    { $set: { emailVerified: new Date() } },
  );

  return { status: "success" };
}

/** Re-sends a verification code (used by the "resend" button). */
export async function resendVerificationAction(
  _prev: VerifyEmailState,
  formData: FormData,
): Promise<VerifyEmailState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { status: "error", error: "Invalid email." };

  // Two-layer throttle: per IP, and per target inbox so it can't be flooded
  // from rotating IPs. Both are checked before any send.
  const byIp = await rateLimitByIp("resend-verify", 3, TEN_MIN);
  const byEmail = rateLimit(
    `resend-verify:email:${email.data.toLowerCase()}`,
    3,
    TEN_MIN,
  );
  if (!byIp.success || !byEmail.success) {
    return { status: "error", error: THROTTLED };
  }

  await connectDB();
  const user = await User.findOne({ email: email.data.toLowerCase() }).lean();
  // Always report success — don't reveal whether an account exists.
  if (user && !user.emailVerified) {
    await sendVerificationCode(email.data);
  }
  return { status: "resent" };
}
