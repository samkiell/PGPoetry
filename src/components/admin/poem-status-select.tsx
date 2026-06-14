"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { changePoemStatus } from "@/app/actions/admin";
import type { PoemStatus } from "@/models/Poem";

const VARIANT: Record<PoemStatus, "default" | "secondary" | "outline"> = {
  published: "default",
  draft: "secondary",
  scheduled: "outline",
};

// Scheduled is set via the editor (it needs a date), so the quick-switch only
// offers the two states that are safe to flip inline.
const OPTIONS: PoemStatus[] = ["draft", "published"];

export function PoemStatusSelect({
  poemId,
  status,
}: {
  poemId: string;
  status: PoemStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function change(next: PoemStatus) {
    if (next === status) return;
    startTransition(async () => {
      const res = await changePoemStatus(poemId, next);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        next === "published" ? "Poem published" : "Moved to drafts",
      );
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        className="focus-visible:ring-ring/50 inline-flex items-center gap-1 rounded-md outline-none focus-visible:ring-[2px] disabled:opacity-60"
        aria-label="Change status"
      >
        <Badge variant={VARIANT[status]} className="cursor-pointer gap-1">
          {status}
          {pending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <ChevronDown className="size-3" />
          )}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-36">
        {OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt}
            onSelect={() => change(opt)}
            className={cn("capitalize", opt === status && "font-semibold")}
          >
            {opt}
            {opt === status ? (
              <span className="text-muted-foreground ml-auto text-xs">current</span>
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
