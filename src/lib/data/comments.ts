import "server-only";
import { connectDB } from "@/lib/db";
import { Comment, type CommentDoc } from "@/models/Comment";

export interface CommentItem {
  id: string;
  text: string;
  authorName: string;
  authorId: string | null;
  authorImage: string;
  authorRole: "reader" | "admin" | null;
  createdAt: string;
}

type LeanComment = Omit<CommentDoc, "author"> & {
  author?: {
    _id: unknown;
    name?: string;
    username?: string;
    image?: string;
    role?: "reader" | "admin";
  } | null;
};

function toItem(doc: LeanComment): CommentItem {
  const author = doc.author && typeof doc.author === "object" && "_id" in doc.author
    ? doc.author
    : null;
  return {
    id: String(doc._id),
    text: doc.text,
    authorName: author?.name || author?.username || doc.authorName || "Anonymous",
    authorId: author ? String(author._id) : null,
    authorImage: author?.image ?? "",
    authorRole: author?.role ?? null,
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}

export async function getComments(poemId: string): Promise<CommentItem[]> {
  await connectDB();
  const docs = await Comment.find({ poem: poemId })
    .sort({ createdAt: -1 })
    .populate("author", "name username image role")
    .lean<LeanComment[]>();
  return docs.map(toItem);
}

export async function getCommentCount(poemId: string): Promise<number> {
  await connectDB();
  return Comment.countDocuments({ poem: poemId });
}

/** Recent comments by a given reader — used on the profile page. */
export async function getCommentsByUser(
  userId: string,
  limit = 20,
): Promise<(CommentItem & { poem: { title: string; slug: string } | null })[]> {
  await connectDB();
  const docs = await Comment.find({ author: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("author", "name username image role")
    .populate("poem", "title slug")
    .lean<(LeanComment & { poem?: { title: string; slug: string } | null })[]>();

  return docs.map((doc) => ({
    ...toItem(doc),
    poem:
      doc.poem && typeof doc.poem === "object" && "slug" in doc.poem
        ? { title: doc.poem.title, slug: doc.poem.slug }
        : null,
  }));
}
