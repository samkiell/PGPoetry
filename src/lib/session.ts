import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { UserRole } from "@/models/User";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  image: string;
  role: UserRole;
  username?: string;
}

/** Returns the signed-in user, or null. Safe to call in any server component. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    image: session.user.image ?? "",
    role: session.user.role,
    username: session.user.username,
  };
}

/** Requires any signed-in user; redirects to /login otherwise. */
export async function requireUser(returnTo?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    const target = returnTo ? `/login?callbackUrl=${encodeURIComponent(returnTo)}` : "/login";
    redirect(target);
  }
  return user;
}

/** Requires the admin role; redirects to /login otherwise. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/login?callbackUrl=/admin");
  }
  return user;
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "admin";
}
