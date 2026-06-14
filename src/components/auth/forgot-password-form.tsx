"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  requestPasswordResetAction,
  type RequestResetState,
} from "@/app/actions/password-reset";

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [state, formAction, pending] = useActionState<
    RequestResetState,
    FormData
  >(requestPasswordResetAction, { status: "idle" });

  if (state.status === "sent") {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm">
          If an account exists for <span className="font-medium">{email}</span>,
          a reset link and code are on the way. Check your inbox.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link
            href={`/reset-password${
              email ? `?email=${encodeURIComponent(email)}` : ""
            }`}
          >
            I have a code
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>

      {state.status === "error" ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Send reset email"}
      </Button>
    </form>
  );
}
