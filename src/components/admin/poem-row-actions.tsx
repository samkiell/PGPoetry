"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deletePoem } from "@/app/actions/admin";

export function PoemRowActions({
  poemId,
  slug,
  title,
  isPublished,
}: {
  poemId: string;
  slug: string;
  title: string;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function remove() {
    startTransition(async () => {
      const res = await deletePoem(poemId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Poem deleted");
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      {isPublished ? (
        <Button asChild variant="ghost" size="icon" aria-label="View poem">
          <Link href={`/poems/${slug}`} target="_blank">
            <ExternalLink className="size-4" />
          </Link>
        </Button>
      ) : null}
      <Button asChild variant="ghost" size="icon" aria-label="Edit poem">
        <Link href={`/admin/poems/${poemId}`}>
          <Pencil className="size-4" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Delete poem"
        onClick={() => setConfirming(true)}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </Button>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this poem?</DialogTitle>
            <DialogDescription>
              “{title}” and all its comments, likes, and favorites will be
              permanently removed. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirming(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={remove}
              disabled={pending}
            >
              {pending ? "Deleting…" : "Delete poem"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
