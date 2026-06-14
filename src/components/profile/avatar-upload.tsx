"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { updateAvatarAction } from "@/app/actions/profile";

export function AvatarUpload({
  name,
  username,
  image,
}: {
  name: string;
  username: string;
  image: string;
}) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [current, setCurrent] = React.useState(image);
  const [busy, setBusy] = React.useState(false);

  const initial = (name || username || "?").charAt(0).toUpperCase();

  async function save(url: string) {
    const body = new FormData();
    body.append("image", url);
    const res = await updateAvatarAction({ status: "idle" }, body);
    if (res.status === "error") {
      toast.error(res.error);
      return false;
    }
    setCurrent(url);
    router.refresh();
    return true;
  }

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Upload failed.");
        return;
      }
      if (await save(data.url)) toast.success("Avatar updated");
    } catch {
      toast.error("Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      if (await save("")) toast.success("Avatar removed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
      <Avatar className="size-16">
        {current ? <AvatarImage src={current} alt={name || username} /> : null}
        <AvatarFallback className="text-lg">{initial}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {current ? "Change" : "Upload"}
          </Button>
          {current ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={remove}
              disabled={busy}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
              Remove
            </Button>
          ) : null}
        </div>
        <p className="text-muted-foreground text-xs">
          JPG, PNG, WEBP, or GIF — 5 MB max.
        </p>
      </div>
    </div>
  );
}
