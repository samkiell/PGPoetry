"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getOrCreateVisitorId } from "@/lib/visitor";
import { rateLimitByIp } from "@/lib/rate-limit";
import { Poem } from "@/models/Poem";
import { Like } from "@/models/Like";
import { Favorite } from "@/models/Favorite";
import { Comment } from "@/models/Comment";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id");

export type ActionResult<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

/* -------------------------------------------------------------------------- */
/*  Likes — open to anonymous visitors (de-duplicated by a signed cookie).     */
/* -------------------------------------------------------------------------- */

export async function toggleLike(
  poemId: string,
): Promise<ActionResult<{ liked: boolean; likes: number }>> {
  const parsed = objectId.safeParse(poemId);
  if (!parsed.success) return { ok: false, error: "Invalid poem." };

  const limited = await rateLimitByIp("like", 30, 60_000);
  if (!limited.success) {
    return { ok: false, error: "You're going a little fast — try again shortly." };
  }

  await connectDB();
  const poem = await Poem.findById(poemId).select("_id likes");
  if (!poem) return { ok: false, error: "Poem not found." };

  const user = await getCurrentUser();
  const identity = user
    ? { user: user.id, visitorId: null }
    : { user: null, visitorId: await getOrCreateVisitorId() };

  const existing = await Like.findOne({ poem: poemId, ...identity });

  let liked: boolean;
  if (existing) {
    await existing.deleteOne();
    liked = false;
  } else {
    await Like.create({ poem: poemId, ...identity });
    liked = true;
  }

  // Keep the denormalised counter honest by recounting.
  const likes = await Like.countDocuments({ poem: poemId });
  await Poem.updateOne({ _id: poemId }, { likes });

  return { ok: true, liked, likes };
}

/* -------------------------------------------------------------------------- */
/*  Favorites — readers only.                                                 */
/* -------------------------------------------------------------------------- */

export async function toggleFavorite(
  poemId: string,
): Promise<ActionResult<{ favorited: boolean }>> {
  const parsed = objectId.safeParse(poemId);
  if (!parsed.success) return { ok: false, error: "Invalid poem." };

  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sign in to save poems to your favorites." };
  }

  await connectDB();
  const poem = await Poem.exists({ _id: poemId });
  if (!poem) return { ok: false, error: "Poem not found." };

  const existing = await Favorite.findOne({ user: user.id, poem: poemId });
  if (existing) {
    await existing.deleteOne();
    revalidatePath("/profile/favorites");
    return { ok: true, favorited: false };
  }

  await Favorite.create({ user: user.id, poem: poemId });
  revalidatePath("/profile/favorites");
  return { ok: true, favorited: true };
}

/* -------------------------------------------------------------------------- */
/*  Comments — anonymous allowed, with a typed display name.                   */
/* -------------------------------------------------------------------------- */

const commentSchema = z.object({
  poemId: objectId,
  poemSlug: z.string().regex(/^[a-z0-9-]+$/),
  text: z.string().trim().min(1, "Write something first.").max(1000),
  anonymousName: z.string().trim().max(60).optional(),
});

export async function addComment(input: {
  poemId: string;
  poemSlug: string;
  text: string;
  anonymousName?: string;
}): Promise<ActionResult> {
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid comment." };
  }
  const { poemId, poemSlug, text, anonymousName } = parsed.data;

  const limited = await rateLimitByIp("comment", 6, 60_000);
  if (!limited.success) {
    return {
      ok: false,
      error: "You've posted a few comments quickly — give it a minute.",
    };
  }

  await connectDB();
  const poem = await Poem.exists({ _id: poemId });
  if (!poem) return { ok: false, error: "Poem not found." };

  const user = await getCurrentUser();
  await Comment.create({
    poem: poemId,
    author: user?.id ?? null,
    authorName: user
      ? user.name || user.username || "Reader"
      : anonymousName?.trim() || "Anonymous",
    text,
  });

  revalidatePath(`/poems/${poemSlug}`);
  return { ok: true };
}

export async function deleteComment(input: {
  commentId: string;
  poemSlug: string;
}): Promise<ActionResult> {
  const parsed = z
    .object({ commentId: objectId, poemSlug: z.string().regex(/^[a-z0-9-]+$/) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not authorized." };

  await connectDB();
  const comment = await Comment.findById(parsed.data.commentId);
  if (!comment) return { ok: false, error: "Comment not found." };

  const isOwner = comment.author && String(comment.author) === user.id;
  if (!isOwner && user.role !== "admin") {
    return { ok: false, error: "You can only delete your own comments." };
  }

  await comment.deleteOne();
  revalidatePath(`/poems/${parsed.data.poemSlug}`);
  return { ok: true };
}
