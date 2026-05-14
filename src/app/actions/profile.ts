"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
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
