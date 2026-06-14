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
  setPasswordAction,
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
  const [setPwState, setPwAction, setPwPending] = useActionState<SettingsState, FormData>(
    setPasswordAction,
    { status: "idle" },
  );

  React.useEffect(() => {
    if (settingsState.status === "success") {
      toast.success("Settings updated");
      router.refresh();
    } else if (settingsState.status === "error") {
      toast.error(settingsState.error);
    }
  }, [settingsState, router]);

  React.useEffect(() => {
    if (passwordState.status === "success") {
      toast.success("Password changed");
      router.refresh();
    } else if (passwordState.status === "error") {
      toast.error(passwordState.error);
    }
  }, [passwordState, router]);

  React.useEffect(() => {
    if (setPwState.status === "success") {
      toast.success("Password set — you can now log in with email and password.");
      router.refresh();
    } else if (setPwState.status === "error") {
      toast.error(setPwState.error);
    }
  }, [setPwState, router]);

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


            <Button type="submit" disabled={passwordPending} className="self-start">
              {passwordPending ? "Updating…" : "Change password"}
            </Button>
          </form>
        </div>
      )}

      {!hasPassword && (
        <div className="border-t pt-8">
          <h3 className="mb-1 text-lg font-semibold">Set a password</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            You signed in with Google. Set a password to also log in with your
            email and password.
          </p>
          <form action={setPwAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="setNewPassword">New password</Label>
              <Input
                id="setNewPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
              />
              <p className="text-muted-foreground text-xs">At least 8 characters</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="setConfirmPassword">Confirm password</Label>
              <Input
                id="setConfirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>


            <Button type="submit" disabled={setPwPending} className="self-start">
              {setPwPending ? "Setting…" : "Set password"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
