import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;
  const viaLink = Boolean(token);

  return (
    <AuthShell
      title="Set a new password"
      subtitle={
        viaLink
          ? "Choose a new password for your account."
          : "Enter the code from your email and a new password."
      }
      footer={
        <>
          Back to{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            log in
          </Link>
        </>
      }
    >
      <ResetPasswordForm token={token ?? ""} email={email ?? ""} />
    </AuthShell>
  );
}
