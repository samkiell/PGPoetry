"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleButton } from "@/components/auth/google-button";
import { signupAction, type SignupState } from "@/app/actions/auth";

export function SignupForm({
  callbackUrl,
  googleEnabled,
}: {
  callbackUrl: string;
  googleEnabled: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [signingIn, setSigningIn] = React.useState(false);

  const [state, formAction, pending] = useActionState<SignupState, FormData>(
    signupAction,
    { status: "idle" },
  );

  // Once the account exists, sign the new reader straight in.
  React.useEffect(() => {
    if (state.status !== "success") return;
    setSigningIn(true);
    void signIn("credentials", { email, password, redirect: false }).then(
      (res) => {
        if (!res || res.error) {
          toast.success("Account created — please log in.");
          router.push("/login");
          return;
        }
        router.push(callbackUrl);
        router.refresh();
      },
    );
  }, [state.status, email, password, callbackUrl, router]);

  return (
    <div className="flex flex-col gap-4">
      {googleEnabled ? (
        <>
          <GoogleButton callbackUrl={callbackUrl} />
          <div className="flex items-center gap-3">
            <span className="bg-border h-px flex-1" />
            <span className="text-muted-foreground text-xs">or</span>
            <span className="bg-border h-px flex-1" />
          </div>
        </>
      ) : null}

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required placeholder="Ada Lovelace" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            required
            placeholder="ada"
            pattern="[A-Za-z0-9_]+"
          />
        </div>
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </div>

        {state.status === "error" ? (
          <p className="text-destructive text-sm">{state.error}</p>
        ) : null}

        <Button
          type="submit"
          disabled={pending || signingIn}
          className="w-full"
        >
          {pending || signingIn ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </div>
  );
}
