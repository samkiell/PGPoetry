import "server-only";
import { connectDB } from "@/lib/db";
import { Collection, type CollectionDoc } from "@/models/Collection";
import { Poem } from "@/models/Poem";
import type { CollectionItem } from "@/types/content";

function toItem(doc: CollectionDoc, poemCount: number): CollectionItem {
  return {
    id: String(doc._id),
    title: doc.title,
    slug: doc.slug,
    description: doc.description ?? "",
    coverImage: doc.coverImage ?? "",
    featured: Boolean(doc.featured),
    poemCount,
  };
}

/** All collections, each annotated with its count of published poems. */
export async function getCollections(): Promise<CollectionItem[]> {
  await connectDB();
  const docs = await Collection.find()
    .sort({ featured: -1, createdAt: -1 })
    .lean<CollectionDoc[]>();

  if (docs.length === 0) return [];

  // One grouped count query covers every collection.
  const counts = await Poem.aggregate<{ _id: unknown; count: number }>([
    { $match: { status: "published", collectionId: { $ne: null } } },
    { $group: { _id: "$collectionId", count: { $sum: 1 } } },
  ]);
  const countBy = new Map(counts.map((c) => [String(c._id), c.count]));

  return docs.map((doc) => toItem(doc, countBy.get(String(doc._id)) ?? 0));
}

export async function getCollectionBySlug(
  slug: string,
): Promise<CollectionItem | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  await connectDB();
  const doc = await Collection.findOne({ slug }).lean<CollectionDoc>();
  if (!doc) return null;
  const count = await Poem.countDocuments({
    status: "published",
    collectionId: doc._id,
  });
  return toItem(doc, count);
}

export async function getFeaturedCollections(
  limit = 3,
): Promise<CollectionItem[]> {
  const all = await getCollections();
  const featured = all.filter((c) => c.featured);
  return (featured.length > 0 ? featured : all).slice(0, limit);
}
