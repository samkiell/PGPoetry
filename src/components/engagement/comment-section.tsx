"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { addComment, deleteComment } from "@/app/actions/engagement";
import { formatDate } from "@/lib/utils";
import type { CommentItem } from "@/lib/data/comments";

interface Viewer {
  id: string;
  role: "reader" | "writer" | "admin";
}

export function CommentSection({
  poemId,
  poemSlug,
  comments,
  viewer,
}: {
  poemId: string;
  poemSlug: string;
  comments: CommentItem[];
  viewer: Viewer | null;
}) {
  const [text, setText] = React.useState("");
  const [name, setName] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    startTransition(async () => {
      const res = await addComment({
        poemId,
        poemSlug,
        text,
        anonymousName: viewer ? undefined : name,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setText("");
      toast.success("Comment posted");
    });
  }

  function remove(commentId: string) {
    startTransition(async () => {
      const res = await deleteComment({ commentId, poemSlug });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Comment deleted");
    });
  }

  return (
    <section className="mt-16 border-t pt-10">
      <h2 className="font-serif mb-6 text-2xl font-semibold">
        Comments
        <span className="text-muted-foreground ml-2 text-base font-normal">
          {comments.length}
        </span>
      </h2>

      <form onSubmit={submit} className="mb-10 flex flex-col gap-3">
        {!viewer ? (
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            maxLength={60}
            aria-label="Your name"
          />
        ) : null}
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            viewer ? "Share your thoughts…" : "Comment as a guest…"
          }
          maxLength={1000}
          rows={3}
          required
        />
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">
            {text.length}/1000
          </span>
          <Button type="submit" size="sm" disabled={pending || !text.trim()}>
            {pending ? "Posting…" : "Post comment"}
          </Button>
        </div>
      </form>

      {comments.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No comments yet — be the first to respond.
        </p>
      ) : (
        <ul className="flex flex-col gap-6">
          {comments.map((comment) => {
            const canDelete =
              viewer &&
              (viewer.role === "admin" || viewer.id === comment.authorId);
            return (
              <li key={comment.id} className="flex gap-3">
                <Avatar className="size-8">
                  {comment.authorImage ? (
                    <AvatarImage
                      src={comment.authorImage}
                      alt={comment.authorName}
                    />
                  ) : null}
                  <AvatarFallback className="text-xs">
                    {comment.authorName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {comment.authorName}
                    </span>
                    {comment.authorRole === "admin" ? (
                      <Badge variant="default" className="text-[10px]">
                        Author
                      </Badge>
                    ) : null}
                    {!comment.authorId ? (
                      <Badge variant="outline" className="text-[10px]">
                        Guest
                      </Badge>
                    ) : null}
                    <span className="text-muted-foreground text-xs">
                      {formatDate(comment.createdAt)}
                    </span>
                    {canDelete ? (
                      <button
                        type="button"
                        onClick={() => remove(comment.id)}
                        disabled={pending}
                        className="text-muted-foreground hover:text-destructive ml-auto"
                        aria-label="Delete comment"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    ) : null}
                  </div>
                  <p className="poem-body mt-1 text-sm leading-relaxed">
                    {comment.text}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
