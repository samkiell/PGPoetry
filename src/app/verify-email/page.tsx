import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";

export const metadata: Metadata = { title: "Verify your email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; callbackUrl?: string }>;
}) {
  const { email, callbackUrl } = await searchParams;

  // No email to verify against — nothing to do here.
  if (!email) redirect("/signup");

  const safeCallback =
    callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/";

  return (
    <AuthShell
      title="Verify your email"
      subtitle={`We sent a 6-digit code to ${email}.`}
      footer={
        <>
          Entered the wrong email?{" "}
          <Link
            href="/signup"
            className="text-primary font-medium hover:underline"
          >
            Start over
          </Link>
        </>
      }
    >
      <VerifyEmailForm email={email} callbackUrl={safeCallback} />
    </AuthShell>
  );
}
