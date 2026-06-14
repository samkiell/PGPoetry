"use client";

import * as React from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleLike } from "@/app/actions/engagement";
import { cn } from "@/lib/utils";

export function LikeButton({
  poemId,
  initialLiked,
  initialCount,
}: {
  poemId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = React.useState(initialLiked);
  const [count, setCount] = React.useState(initialCount);
  const [pending, startTransition] = React.useTransition();

  function onClick() {
    // Optimistic toggle, reconciled with the server result below.
    const optimisticLiked = !liked;
    setLiked(optimisticLiked);
    setCount((c) => c + (optimisticLiked ? 1 : -1));

    startTransition(async () => {
      const res = await toggleLike(poemId);
      if (!res.ok) {
        setLiked(liked);
        setCount(count);
        toast.error(res.error);
        return;
      }
      setLiked(res.liked);
      setCount(res.likes);
    });
  }

  return (
    <Button
      variant={liked ? "default" : "outline"}
      size="lg"
      onClick={onClick}
      disabled={pending}
      aria-pressed={liked}
      className="gap-2 text-base"
    >
      <Heart className={cn("size-5", liked && "fill-current")} />
      {count}
      <span className="sr-only">likes</span>
    </Button>
  );
}
