import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { getCurrentUser } from "@/lib/session";
import { isGoogleAuthEnabled } from "@/lib/env";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignupPage({
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
      title="Create your account"
      subtitle="Join PGpoetry to collect the lines that find you."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <SignupForm callbackUrl={safeCallback} googleEnabled={isGoogleAuthEnabled} />
    </AuthShell>
  );
}
