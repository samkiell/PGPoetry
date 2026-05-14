"use server";

import { z } from "zod";
import { registerUser } from "@/lib/auth-credentials";

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
  | { status: "success" };

export async function signupAction(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
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

  // Account created — the client signs in with the same credentials next.
  return { status: "success" };
}
