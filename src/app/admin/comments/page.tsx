import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";
import { CommentsManager } from "@/components/admin/comments-manager";
import { getAllComments } from "@/lib/data/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Comments — Admin" };

export default async function AdminCommentsPage() {
  const comments = await getAllComments();

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <MessageSquare className="size-6" />
          <h1 className="text-2xl font-semibold">Comments</h1>
        </div>
        <p className="text-muted-foreground">
          The {comments.length} most recent comments across all poems. Remove
          anything that doesn&apos;t belong.
        </p>
      </div>

      <CommentsManager comments={comments} />
    </div>
  );
}
