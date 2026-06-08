"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateSettingsAction,
  updatePasswordAction,
  type SettingsState,
} from "@/app/actions/profile";

export function SettingsForm({
  email,
  username,
  hasPassword,
}: {
  email: string;
  username: string;
  hasPassword: boolean;
}) {
  const router = useRouter();
  const [settingsState, settingsAction, settingsPending] = useActionState<SettingsState, FormData>(
    updateSettingsAction,
    { status: "idle" },
  );
  const [passwordState, passwordAction, passwordPending] = useActionState<SettingsState, FormData>(
    updatePasswordAction,
    { status: "idle" },
  );

  React.useEffect(() => {
    if (settingsState.status === "success") {
      toast.success("Settings updated");
      router.refresh();
    }
  }, [settingsState.status, router]);

  React.useEffect(() => {
    if (passwordState.status === "success") {
      toast.success("Password changed");
      router.refresh();
    }
  }, [passwordState.status, router]);

  return (
    <div className="space-y-8">
      {/* Account Settings */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Account Settings</h3>
        <form action={settingsAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={email}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              defaultValue={username}
              required
              maxLength={30}
              placeholder="e.g., poeticmuse"
            />
            <p className="text-muted-foreground text-xs">
              3-30 characters, letters, numbers, hyphens, and underscores only
            </p>
          </div>

          {settingsState.status === "error" ? (
            <p className="text-destructive text-sm">{settingsState.error}</p>
          ) : null}

          <Button type="submit" disabled={settingsPending} className="self-start">
            {settingsPending ? "Saving…" : "Save account settings"}
          </Button>
        </form>
      </div>

      {/* Password Settings */}
      {hasPassword && (
        <div className="border-t pt-8">
          <h3 className="mb-4 text-lg font-semibold">Change Password</h3>
          <form action={passwordAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={8}
              />
              <p className="text-muted-foreground text-xs">
                At least 8 characters
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
              />
            </div>

            {passwordState.status === "error" ? (
              <p className="text-destructive text-sm">{passwordState.error}</p>
            ) : null}

            <Button type="submit" disabled={passwordPending} className="self-start">
              {passwordPending ? "Updating…" : "Change password"}
            </Button>
          </form>
        </div>
      )}

      {!hasPassword && (
        <div className="border-t pt-8">
          <p className="text-muted-foreground text-sm">
            You&apos;re signed in with OAuth (Google). To use a password, try signing in normally.
          </p>
        </div>
      )}
    </div>
  );
}
