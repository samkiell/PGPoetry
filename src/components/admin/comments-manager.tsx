"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteCommentAsAdmin } from "@/app/actions/admin";
import { formatDate } from "@/lib/utils";
import type { AdminCommentRow } from "@/lib/data/admin";

export function CommentsManager({ comments }: { comments: AdminCommentRow[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function remove(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      const res = await deleteCommentAsAdmin(id);
      setDeletingId(null);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Comment deleted");
      router.refresh();
    });
  }

  if (comments.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border py-12 text-center text-sm">
        No comments yet.
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-lg border">
      {comments.map((c) => (
        <li key={c.id} className="flex items-start justify-between gap-4 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm break-words">{c.text}</p>
            <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
              <span className="font-medium">{c.authorName}</span>
              <span>·</span>
              <span>{formatDate(c.createdAt)}</span>
              {c.poem ? (
                <>
                  <span>·</span>
                  <Link
                    href={`/poems/${c.poem.slug}`}
                    target="_blank"
                    className="hover:text-primary inline-flex items-center gap-1"
                  >
                    {c.poem.title}
                    <ExternalLink className="size-3" />
                  </Link>
                </>
              ) : (
                <span className="italic">deleted poem</span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => remove(c.id)}
            disabled={pending}
            aria-label="Delete comment"
            className="text-muted-foreground hover:text-destructive shrink-0"
          >
            {pending && deletingId === c.id ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </Button>
        </li>
      ))}
    </ul>
  );
}
