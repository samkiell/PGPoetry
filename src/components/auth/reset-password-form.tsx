"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import {
  resetPasswordAction,
  resendPasswordResetAction,
  type ResetState,
  type RequestResetState,
} from "@/app/actions/password-reset";

export function ResetPasswordForm({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const router = useRouter();
  const viaLink = token.length > 0;
  const [showPassword, setShowPassword] = React.useState(false);
  const [emailValue, setEmailValue] = React.useState(email);

  const [state, formAction, pending] = useActionState<ResetState, FormData>(
    resetPasswordAction,
    { status: "idle" },
  );
  const [resendState, resendAction, resending] = useActionState<
    RequestResetState,
    FormData
  >(resendPasswordResetAction, { status: "idle" });

  React.useEffect(() => {
    if (state.status === "success") {
      toast.success("Password updated — please log in.");
      router.push("/login");
    } else if (state.status === "error") {
      toast.error(state.error);
    }
  }, [state, router]);

  React.useEffect(() => {
    if (resendState.status === "sent") {
      toast.success("If that account exists, a new code is on its way.");
    } else if (resendState.status === "error") {
      toast.error(resendState.error);
    }
  }, [resendState]);

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
      {viaLink ? (
        <input type="hidden" name="token" value={token} />
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="code">Reset code</Label>
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
        </>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">New password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2 transition-colors focus-visible:outline-none"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={pending || state.status === "success"}
        className="w-full"
      >
        {pending || state.status === "success" ? "Saving…" : "Update password"}
      </Button>
      </form>

      {!viaLink ? (
        <form action={resendAction} className="text-center">
          <input type="hidden" name="email" value={emailValue} />
          <button
            type="submit"
            disabled={resending || emailValue.length === 0}
            className="text-muted-foreground hover:text-foreground text-sm transition-colors disabled:opacity-50"
          >
            {resending ? "Sending…" : "Didn't get a code? Resend"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
