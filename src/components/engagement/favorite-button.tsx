"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleFavorite } from "@/app/actions/engagement";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  poemId,
  initialFavorited,
  isLoggedIn,
}: {
  poemId: string;
  initialFavorited: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [favorited, setFavorited] = React.useState(initialFavorited);
  const [pending, startTransition] = React.useTransition();

  function onClick() {
    if (!isLoggedIn) {
      toast.info("Sign in to save poems to your favorites.", {
        action: { label: "Log in", onClick: () => router.push("/login") },
      });
      return;
    }

    const optimistic = !favorited;
    setFavorited(optimistic);

    startTransition(async () => {
      const res = await toggleFavorite(poemId);
      if (!res.ok) {
        setFavorited(!optimistic);
        toast.error(res.error);
        return;
      }
      setFavorited(res.favorited);
      toast.success(res.favorited ? "Saved to favorites" : "Removed from favorites");
    });
  }

  return (
    <Button
      variant={favorited ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      disabled={pending}
      aria-pressed={favorited}
    >
      <Bookmark className={cn("size-4", favorited && "fill-current")} />
      {favorited ? "Saved" : "Save"}
    </Button>
  );
}
