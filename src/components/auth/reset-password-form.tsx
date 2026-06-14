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
  type ResetState,
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

  const [state, formAction, pending] = useActionState<ResetState, FormData>(
    resetPasswordAction,
    { status: "idle" },
  );

  React.useEffect(() => {
    if (state.status === "success") {
      toast.success("Password updated — please log in.");
      router.push("/login");
    }
  }, [state.status, router]);

  return (
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
              defaultValue={email}
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

      {state.status === "error" ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}

      <Button
        type="submit"
        disabled={pending || state.status === "success"}
        className="w-full"
      >
        {pending || state.status === "success" ? "Saving…" : "Update password"}
      </Button>
    </form>
  );
}
