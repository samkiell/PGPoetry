import "server-only";
import type { QueryFilter } from "mongoose";
import { connectDB } from "@/lib/db";
import { Poem, type PoemDoc } from "@/models/Poem";
import { Collection } from "@/models/Collection";
import {
  excerpt,
  htmlToPlainText,
  readingTime,
  stripSignature,
  wordCount,
} from "@/lib/utils";
import type {
  PaginatedPoems,
  PoemDetail,
  PoemListItem,
} from "@/types/content";

/** A lean poem doc with its collection optionally populated. */
type LeanPoem = Omit<PoemDoc, "collectionId"> & {
  collectionId?:
    | { _id: unknown; title: string; slug: string }
    | { toString(): string }
    | null;
};

function populatedCollection(
  value: LeanPoem["collectionId"],
): { title: string; slug: string } | null {
  return value && typeof value === "object" && "slug" in value
    ? { title: value.title, slug: value.slug }
    : null;
}

function toListItem(doc: LeanPoem): PoemListItem {
  const plain = htmlToPlainText(doc.content);
  const { text, truncated } = excerpt(plain);
  return {
    id: String(doc._id),
    title: doc.title,
    slug: doc.slug,
    excerpt: text,
    truncated,
    tags: doc.tags ?? [],
    featured: Boolean(doc.featured),
    coverImage: doc.coverImage ?? "",
    likes: doc.likes ?? 0,
    views: doc.views ?? 0,
    readingMinutes: readingTime(plain),
    publishedAt: doc.publishedAt ? new Date(doc.publishedAt).toISOString() : null,
    collection: populatedCollection(doc.collectionId),
  };
}

function toDetail(doc: LeanPoem): PoemDetail {
  // Keep the raw content for rendering; derive counts from the plain text.
  const content = stripSignature(doc.content);
  const plain = htmlToPlainText(content);
  return {
    id: String(doc._id),
    title: doc.title,
    slug: doc.slug,
    content,
    tags: doc.tags ?? [],
    featured: Boolean(doc.featured),
    status: doc.status,
    coverImage: doc.coverImage ?? "",
    likes: doc.likes ?? 0,
    views: doc.views ?? 0,
    wordCount: wordCount(plain),
    readingMinutes: readingTime(plain),
    publishedAt: doc.publishedAt ? new Date(doc.publishedAt).toISOString() : null,
    createdAt: new Date(doc.createdAt).toISOString(),
    collection: populatedCollection(doc.collectionId),
  };
}

/** Base filter — only poems that are actually live to the public. */
const PUBLISHED: QueryFilter<PoemDoc> = { status: "published" };

export interface PoemQuery {
  q?: string;
  tag?: string;
  collectionSlug?: string;
  page?: number;
  perPage?: number;
  sort?: "recent" | "popular";
}

export async function getPublishedPoems(
  opts: PoemQuery = {},
): Promise<PaginatedPoems> {
  await connectDB();

  const page = Math.max(1, opts.page ?? 1);
  const perPage = Math.min(48, Math.max(1, opts.perPage ?? 12));
  const filter: QueryFilter<PoemDoc> = { ...PUBLISHED };

  if (opts.q?.trim()) {
    const rx = new RegExp(escapeRegExp(opts.q.trim()), "i");
    filter.$or = [{ title: rx }, { content: rx }, { tags: rx }];
  }
  if (opts.tag?.trim()) {
    filter.tags = opts.tag.trim().toLowerCase();
  }
  if (opts.collectionSlug?.trim()) {
    const collection = await Collection.findOne({
      slug: opts.collectionSlug.trim().toLowerCase(),
    })
      .select("_id")
      .lean();
    // Unknown collection => no matches, rather than ignoring the filter.
    filter.collectionId = collection?._id ?? null;
  }

  const sort: Record<string, -1 | 1> =
    opts.sort === "popular"
      ? { views: -1, publishedAt: -1 }
      : { publishedAt: -1 };

  const [docs, total] = await Promise.all([
    Poem.find(filter)
      .sort(sort)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate("collectionId", "title slug")
      .lean<LeanPoem[]>(),
    Poem.countDocuments(filter),
  ]);

  return {
    poems: docs.map(toListItem),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
    perPage,
  };
}

export async function getFeaturedPoems(limit = 3): Promise<PoemListItem[]> {
  await connectDB();
  const docs = await Poem.find({ ...PUBLISHED, featured: true })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .populate("collectionId", "title slug")
    .lean<LeanPoem[]>();
  return docs.map(toListItem);
}

export async function getLatestPoems(limit = 6): Promise<PoemListItem[]> {
  await connectDB();
  const docs = await Poem.find(PUBLISHED)
    .sort({ publishedAt: -1 })
    .limit(limit)
    .populate("collectionId", "title slug")
    .lean<LeanPoem[]>();
  return docs.map(toListItem);
}

export async function getPoemBySlug(slug: string): Promise<PoemDetail | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  await connectDB();
  const doc = await Poem.findOne({ slug, ...PUBLISHED })
    .populate("collectionId", "title slug")
    .lean<LeanPoem>();
  return doc ? toDetail(doc) : null;
}

/** Fire-and-forget view counter — call from the poem page after render. */
export async function incrementPoemViews(id: string): Promise<void> {
  await connectDB();
  await Poem.updateOne({ _id: id }, { $inc: { views: 1 } });
}

export async function getRelatedPoems(
  poemId: string,
  tags: string[],
  limit = 4,
): Promise<PoemListItem[]> {
  if (tags.length === 0) return [];
  await connectDB();
  const docs = await Poem.find({
    ...PUBLISHED,
    _id: { $ne: poemId },
    tags: { $in: tags },
  })
    .sort({ views: -1, publishedAt: -1 })
    .limit(limit)
    .populate("collectionId", "title slug")
    .lean<LeanPoem[]>();
  return docs.map(toListItem);
}

export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  await connectDB();
  const rows = await Poem.aggregate<{ _id: string; count: number }>([
    { $match: PUBLISHED },
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
  ]);
  return rows.map((r) => ({ tag: r._id, count: r.count }));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
