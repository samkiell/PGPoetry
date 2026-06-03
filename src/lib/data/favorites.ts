import "server-only";
import { connectDB } from "@/lib/db";
import { Favorite } from "@/models/Favorite";
import { excerpt, formatReadingTime } from "@/lib/utils";
import type { PoemDoc } from "@/models/Poem";
import type { PoemListItem } from "@/types/content";

type PopulatedFavorite = {
  _id: unknown;
  poem: (PoemDoc & { _id: unknown }) | null;
};

/** A reader's saved poems, newest save first. */
export async function getUserFavorites(
  userId: string,
): Promise<PoemListItem[]> {
  await connectDB();
  const favorites = await Favorite.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate({
      path: "poem",
      select:
        "title slug content tags featured coverImage likes views publishedAt status",
    })
    .lean<PopulatedFavorite[]>();

  return favorites
    .map((fav) => fav.poem)
    // A poem may have been unpublished or deleted since it was saved.
    .filter((poem): poem is PoemDoc & { _id: unknown } =>
      Boolean(poem && poem.status === "published"),
    )
    .map((poem) => {
      const { text, truncated } = excerpt(poem.content);
      return {
        id: String(poem._id),
        title: poem.title,
        slug: poem.slug,
        excerpt: text,
        truncated,
        tags: poem.tags ?? [],
        featured: Boolean(poem.featured),
        coverImage: poem.coverImage ?? "",
        likes: poem.likes ?? 0,
        views: poem.views ?? 0,
        readingTime: formatReadingTime(poem.content),
        publishedAt: poem.publishedAt
          ? new Date(poem.publishedAt).toISOString()
          : null,
        collection: null,
      };
    });
}

export async function getFavoriteCount(userId: string): Promise<number> {
  await connectDB();
  return Favorite.countDocuments({ user: userId });
}
