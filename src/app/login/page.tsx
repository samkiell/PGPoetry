import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/session";
import { isGoogleAuthEnabled } from "@/lib/env";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const safeCallback =
    callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/";

  const user = await getCurrentUser();
  if (user) redirect(safeCallback);

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to like, save, and comment on poems."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="text-primary font-medium hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm callbackUrl={safeCallback} googleEnabled={isGoogleAuthEnabled} />
    </AuthShell>
  );
}
