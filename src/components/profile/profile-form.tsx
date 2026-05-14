"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  updateProfileAction,
  type ProfileState,
} from "@/app/actions/profile";

export function ProfileForm({
  name,
  bio,
}: {
  name: string;
  bio: string;
}) {
  const router = useRouter();
  const [bioValue, setBioValue] = React.useState(bio);
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateProfileAction,
    { status: "idle" },
  );

  React.useEffect(() => {
    if (state.status === "success") {
      toast.success("Profile updated");
      router.refresh();
    }
  }, [state.status, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Display name</Label>
        <Input id="name" name="name" defaultValue={name} required maxLength={80} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          value={bioValue}
          onChange={(e) => setBioValue(e.target.value)}
          maxLength={280}
          rows={3}
          placeholder="A line or two about you…"
        />
        <span className="text-muted-foreground self-end text-xs">
          {bioValue.length}/280
        </span>
      </div>

      {state.status === "error" ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
