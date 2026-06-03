"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcryptjs from "bcryptjs";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { User } from "@/models/User";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name can't be empty.").max(80),
  bio: z.string().trim().max(280, "Bio must be 280 characters or fewer."),
});

export type ProfileState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "success" };

const settingsSchema = z.object({
  email: z.string().email("Invalid email address."),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(30, "Username must be 30 characters or fewer.")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens, and underscores."),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});

export type SettingsState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "success" };

export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", error: "You're not signed in." };

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    bio: formData.get("bio") ?? "",
  });
  if (!parsed.success) {
    return {
      status: "error",
      error: parsed.error.issues[0]?.message ?? "Please check your details.",
    };
  }

  await connectDB();
  await User.updateOne(
    { _id: user.id },
    { name: parsed.data.name, bio: parsed.data.bio },
  );

  revalidatePath("/profile");
  return { status: "success" };
}

export async function updateSettingsAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", error: "You're not signed in." };

  const parsed = settingsSchema.safeParse({
    email: formData.get("email"),
    username: formData.get("username"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      error: parsed.error.issues[0]?.message ?? "Please check your details.",
    };
  }

  await connectDB();

  // Check if email is already taken by another user
  if (parsed.data.email !== user.email) {
    const existingEmail = await User.findOne({
      email: parsed.data.email,
      _id: { $ne: user.id },
    });
    if (existingEmail) {
      return { status: "error", error: "Email is already in use." };
    }
  }

  // Check if username is already taken by another user
  if (parsed.data.username !== user.username) {
    const existingUsername = await User.findOne({
      username: parsed.data.username,
      _id: { $ne: user.id },
    });
    if (existingUsername) {
      return { status: "error", error: "Username is already taken." };
    }
  }

  await User.updateOne(
    { _id: user.id },
    { email: parsed.data.email, username: parsed.data.username },
  );

  revalidatePath("/profile");
  revalidatePath("/profile/settings");
  return { status: "success" };
}

export async function updatePasswordAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", error: "You're not signed in." };

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      error: parsed.error.issues[0]?.message ?? "Please check your details.",
    };
  }

  await connectDB();
  const userWithPassword = await User.findById(user.id).select("+password");
  if (!userWithPassword?.password) {
    return { status: "error", error: "You don't have a password set. Use OAuth sign-in." };
  }

  // Verify current password
  const isValidPassword = await bcryptjs.compare(parsed.data.currentPassword, userWithPassword.password);
  if (!isValidPassword) {
    return { status: "error", error: "Current password is incorrect." };
  }

  // Hash new password
  const hashedPassword = await bcryptjs.hash(parsed.data.newPassword, 10);
  await User.updateOne(
    { _id: user.id },
    { password: hashedPassword },
  );

  revalidatePath("/profile/settings");
  return { status: "success" };
}
