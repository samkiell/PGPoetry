"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Upload failed.");
        return;
      }
      onChange(data.url);
      toast.success("Cover image uploaded");
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
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

      {value ? (
        <div className="relative aspect-video overflow-hidden rounded-md border">
          <Image
            src={value}
            alt="Cover preview"
            fill
            sizes="400px"
            className="object-cover"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="bg-background/90 hover:bg-background absolute top-2 right-2 grid size-7 place-items-center rounded-full border"
            aria-label="Remove cover image"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="border-input hover:bg-accent flex aspect-video flex-col items-center justify-center gap-2 rounded-md border border-dashed text-sm transition-colors"
        >
          {uploading ? (
            <Loader2 className="text-muted-foreground size-6 animate-spin" />
          ) : (
            <ImagePlus className="text-muted-foreground size-6" />
          )}
          <span className="text-muted-foreground">
            {uploading ? "Uploading…" : "Upload a cover image"}
          </span>
        </button>
      )}

      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="self-start"
        >
          Replace image
        </Button>
      ) : null}
    </div>
  );
}
