import "server-only";
import { connectDB } from "@/lib/db";
import { User, type UserDoc } from "@/models/User";

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  image: string;
  bio: string;
  role: "reader" | "admin";
  joinedAt: string;
}

/** Full profile record — includes fields (like bio) not carried in the session. */
export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  await connectDB();
  const user = await User.findById(userId).lean<UserDoc>();
  if (!user) return null;
  return {
    id: String(user._id),
    name: user.name ?? "",
    username: user.username ?? "",
    email: user.email,
    image: user.image ?? "",
    bio: user.bio ?? "",
    role: user.role ?? "reader",
    joinedAt: new Date(user.createdAt ?? Date.now()).toISOString(),
  };
}
