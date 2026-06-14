"use client";

import * as React from "react";
import { Check, ImageDown, Link2, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ShareButton({
  title,
  url,
  slug,
}: {
  title: string;
  url: string;
  slug: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const [imaging, setImaging] = React.useState(false);

  const text = encodeURIComponent(`${title} — PGpoetry`);
  const encodedUrl = encodeURIComponent(url);

  const targets = [
    { label: "X / Twitter", href: `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { label: "WhatsApp", href: `https://wa.me/?text=${text}%20${encodedUrl}` },
  ];

  async function nativeShareOrMenu() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled — no-op
      }
      return true;
    }
    return false;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link");
    }
  }

  async function shareAsImage() {
    if (imaging) return;
    setImaging(true);
    try {
      const res = await fetch(`/poems/${slug}/share-image`);
      if (!res.ok) throw new Error("render failed");
      const blob = await res.blob();
      const file = new File([blob], `${slug}.png`, { type: "image/png" });

      // Prefer the OS share sheet (with the image) when it can handle files.
      if (
        typeof navigator !== "undefined" &&
        navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({ files: [file], title });
        return;
      }

      // Otherwise download the image.
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${slug}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success("Image downloaded");
    } catch (err) {
      // AbortError = user dismissed the native share sheet; not an error.
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("Couldn't create the image");
    } finally {
      setImaging(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={async (e) => {
            // Prefer the OS share sheet on mobile; fall back to the menu.
            const handled = await nativeShareOrMenu();
            if (handled) e.preventDefault();
          }}
        >
          <Share2 className="size-4" /> Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={copyLink}>
          {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
          {copied ? "Copied!" : "Copy link"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            // Keep the menu logic from closing before the async work starts.
            e.preventDefault();
            shareAsImage();
          }}
          disabled={imaging}
        >
          {imaging ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImageDown className="size-4" />
          )}
          {imaging ? "Creating…" : "Share as image"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {targets.map((t) => (
          <DropdownMenuItem key={t.label} asChild>
            <a href={t.href} target="_blank" rel="noopener noreferrer">
              {t.label}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
