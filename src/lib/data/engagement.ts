import "server-only";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { peekVisitorId } from "@/lib/visitor";
import { Like } from "@/models/Like";
import { Favorite } from "@/models/Favorite";
import { Comment } from "@/models/Comment";

export interface EngagementState {
  liked: boolean;
  favorited: boolean;
  likeCount: number;
  commentCount: number;
}

/**
 * Resolves the current viewer's engagement with a poem for first paint.
 * Read-only — never writes the visitor cookie (that happens on like).
 */
export async function getEngagementState(
  poemId: string,
): Promise<EngagementState> {
  await connectDB();
  const user = await getCurrentUser();
  const visitorId = user ? null : await peekVisitorId();

  const likeIdentity = user
    ? { poem: poemId, user: user.id }
    : visitorId
      ? { poem: poemId, visitorId }
      : null;

  const [likedDoc, favoritedDoc, likeCount, commentCount] = await Promise.all([
    likeIdentity ? Like.exists(likeIdentity) : Promise.resolve(null),
    user
      ? Favorite.exists({ poem: poemId, user: user.id })
      : Promise.resolve(null),
    Like.countDocuments({ poem: poemId }),
    Comment.countDocuments({ poem: poemId }),
  ]);

  return {
    liked: Boolean(likedDoc),
    favorited: Boolean(favoritedDoc),
    likeCount,
    commentCount,
  };
}
