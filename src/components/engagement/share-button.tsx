"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import {
  Check,
  Download,
  Image as ImageIcon,
  Link2,
  Loader2,
  Share2,
} from "lucide-react";
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
  const { resolvedTheme } = useTheme();
  const [copied, setCopied] = React.useState(false);
  const [busy, setBusy] = React.useState<null | "share" | "download">(null);

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

  // Render the poem image for the current theme.
  async function fetchImage(): Promise<Blob> {
    const theme = resolvedTheme === "light" ? "light" : "dark";
    const res = await fetch(`/poems/${slug}/share-image?theme=${theme}`);
    if (!res.ok) throw new Error("render failed");
    return res.blob();
  }

  async function shareImage() {
    if (busy) return;
    setBusy("share");
    try {
      const blob = await fetchImage();
      const file = new File([blob], `${slug}.png`, { type: "image/png" });
      if (
        typeof navigator !== "undefined" &&
        navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({ files: [file], title });
      } else {
        // No file-share support (most desktops) — fall back to a download.
        triggerDownload(blob);
        toast.success("Image downloaded");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return; // dismissed
      toast.error("Couldn't create the image");
    } finally {
      setBusy(null);
    }
  }

  async function downloadImage() {
    if (busy) return;
    setBusy("download");
    try {
      triggerDownload(await fetchImage());
      toast.success("Image downloaded");
    } catch {
      toast.error("Couldn't create the image");
    } finally {
      setBusy(null);
    }
  }

  function triggerDownload(blob: Blob) {
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = `${slug}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
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
            // Don't let the menu close before the async work starts.
            e.preventDefault();
            shareImage();
          }}
          disabled={busy !== null}
        >
          {busy === "share" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImageIcon className="size-4" />
          )}
          {busy === "share" ? "Creating…" : "Share image"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            downloadImage();
          }}
          disabled={busy !== null}
        >
          {busy === "download" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          {busy === "download" ? "Creating…" : "Download image"}
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
