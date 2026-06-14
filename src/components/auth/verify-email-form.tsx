"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  verifyEmailAction,
  resendVerificationAction,
  type VerifyEmailState,
} from "@/app/actions/auth";

export function VerifyEmailForm({
  email,
  callbackUrl,
}: {
  email: string;
  callbackUrl: string;
}) {
  const router = useRouter();

  const [state, formAction, pending] = useActionState<VerifyEmailState, FormData>(
    verifyEmailAction,
    { status: "idle" },
  );
  const [resendState, resendAction, resending] = useActionState<
    VerifyEmailState,
    FormData
  >(resendVerificationAction, { status: "idle" });

  React.useEffect(() => {
    if (state.status === "success") {
      toast.success("Email verified — please log in.");
      const params = new URLSearchParams({ callbackUrl });
      router.push(`/login?${params.toString()}`);
    }
  }, [state.status, callbackUrl, router]);

  React.useEffect(() => {
    if (resendState.status === "resent") {
      toast.success("A new code is on its way.");
    }
  }, [resendState.status]);

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="email" value={email} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            placeholder="123456"
            className="text-center text-lg tracking-[0.4em]"
          />
        </div>

        {state.status === "error" ? (
          <p className="text-destructive text-sm">{state.error}</p>
        ) : null}

        <Button
          type="submit"
          disabled={pending || state.status === "success"}
          className="w-full"
        >
          {pending || state.status === "success" ? "Verifying…" : "Verify email"}
        </Button>
      </form>

      <form action={resendAction} className="text-center">
        <input type="hidden" name="email" value={email} />
        <button
          type="submit"
          disabled={resending}
          className="text-muted-foreground hover:text-foreground text-sm transition-colors disabled:opacity-50"
        >
          {resending ? "Sending…" : "Didn't get it? Resend code"}
        </button>
      </form>
    </div>
  );
}
