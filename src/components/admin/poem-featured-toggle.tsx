"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { togglePoemFeatured } from "@/app/actions/admin";

export function PoemFeaturedToggle({
  poemId,
  featured,
}: {
  poemId: string;
  featured: boolean;
}) {
  const router = useRouter();
  // Optimistic local state so the star flips instantly.
  const [on, setOn] = React.useState(featured);
  const [pending, startTransition] = React.useTransition();

  // Keep in sync if the row re-renders with a new prop (e.g. after refresh).
  const [lastProp, setLastProp] = React.useState(featured);
  if (featured !== lastProp) {
    setLastProp(featured);
    setOn(featured);
  }

  function toggle() {
    const next = !on;
    setOn(next);
    startTransition(async () => {
      const res = await togglePoemFeatured(poemId, next);
      if (!res.ok) {
        setOn(!next); // roll back
        toast.error(res.error);
        return;
      }
      setOn(res.featured);
      toast.success(res.featured ? "Marked as featured" : "Removed from featured");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={on}
      aria-label={on ? "Unfeature poem" : "Feature poem"}
      title={on ? "Featured — click to unfeature" : "Click to feature"}
      className="text-muted-foreground hover:text-primary focus-visible:ring-ring/50 inline-flex size-7 items-center justify-center rounded-md outline-none focus-visible:ring-[2px] disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Star className={cn("size-4", on && "fill-primary text-primary")} />
      )}
    </button>
  );
}
