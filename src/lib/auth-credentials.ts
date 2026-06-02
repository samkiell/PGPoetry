import "server-only";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { env } from "@/lib/env";
import { User, type UserRole } from "@/models/User";

/**
 * Node-runtime auth helpers. Imported lazily from `auth.config.ts` so that
 * module stays edge-compatible for middleware.
 */

const SALT_ROUNDS = 12;

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image: string;
  role: UserRole;
  username?: string;
}

/** The email in ADMIN_EMAIL is always promoted to the admin role. */
export function roleForEmail(email: string): UserRole {
  return env.ADMIN_EMAIL && email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase()
    ? "admin"
    : "reader";
}

/** Validates email/username and password for the Credentials provider. */
export async function verifyCredentials(
  usernameOrEmail: string,
  password: string,
): Promise<SessionUser | null> {
  await connectDB();

  const identifier = usernameOrEmail.trim();
  const escaped = identifier.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");

  const user = await User.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: { $regex: new RegExp(`^${escaped}$`, "i") } },
    ],
  })
    .select("+password")
    .lean();

  // No account, or an OAuth-only account with no password set.
  if (!user || !user.password) return null;

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return null;

  // Keep the admin email promoted even if the DB row drifted.
  const role = user.role === "admin" ? "admin" : roleForEmail(user.email);

  return {
    id: user._id.toString(),
    name: user.name || user.username || "",
    email: user.email,
    image: user.image || "",
    role,
    username: user.username,
  };
}

/** Used by the jwt callback to attach role/username to the token. */
export async function getUserAuthFields(
  userId: string,
): Promise<{ role: UserRole; username?: string } | null> {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) return null;

  // Reconcile the admin role on every sign-in.
  const expected = roleForEmail(user.email);
  if (expected === "admin" && user.role !== "admin") {
    user.role = "admin";
    await user.save();
  }

  return { role: user.role, username: user.username };
}

export interface RegisterInput {
  name: string;
  email: string;
  username: string;
  password: string;
}

export type RegisterResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

/** Creates a credentials (email/password) account. */
export async function registerUser(
  input: RegisterInput,
): Promise<RegisterResult> {
  await connectDB();

  const email = input.email.toLowerCase().trim();
  const username = input.username.trim();

  const existing = await User.findOne({
    $or: [{ email }, { username }],
  }).lean();
  if (existing) {
    return {
      ok: false,
      error:
        existing.email === email
          ? "An account with that email already exists."
          : "That username is taken.",
    };
  }

  const password = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await User.create({
    name: input.name.trim(),
    email,
    username,
    password,
    role: roleForEmail(email),
  });

  return { ok: true, userId: user._id.toString() };
}
