import "server-only";
import { connectDB } from "@/lib/db";
import { Poem, type PoemDoc, type PoemStatus } from "@/models/Poem";
import { Comment } from "@/models/Comment";
import { Like } from "@/models/Like";

export interface AdminStats {
  totalPoems: number;
  published: number;
  drafts: number;
  scheduled: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
}

export interface AdminPoemRow {
  id: string;
  title: string;
  slug: string;
  status: PoemStatus;
  featured: boolean;
  views: number;
  likes: number;
  collectionTitle: string | null;
  publishedAt: string | null;
  scheduledFor: string | null;
  updatedAt: string;
}

export interface PoemEditData {
  id: string;
  title: string;
  content: string;
  tags: string[];
  featured: boolean;
  status: PoemStatus;
  coverImage: string;
  collectionId: string | null;
  scheduledFor: string | null;
}

type LeanAdminPoem = Omit<PoemDoc, "collectionId"> & {
  collectionId?: { _id: unknown; title: string } | null;
};

export async function getAdminStats(): Promise<AdminStats> {
  await connectDB();
  const [byStatus, viewsLikes, totalComments] = await Promise.all([
    Poem.aggregate<{ _id: PoemStatus; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Poem.aggregate<{ _id: null; views: number; likes: number }>([
      {
        $group: {
          _id: null,
          views: { $sum: "$views" },
          likes: { $sum: "$likes" },
        },
      },
    ]),
    Comment.countDocuments(),
  ]);

  const counts = new Map(byStatus.map((s) => [s._id, s.count]));
  const published = counts.get("published") ?? 0;
  const drafts = counts.get("draft") ?? 0;
  const scheduled = counts.get("scheduled") ?? 0;

  return {
    totalPoems: published + drafts + scheduled,
    published,
    drafts,
    scheduled,
    totalViews: viewsLikes[0]?.views ?? 0,
    totalLikes: viewsLikes[0]?.likes ?? 0,
    totalComments,
  };
}

export async function getAdminPoems(
  status?: PoemStatus,
): Promise<AdminPoemRow[]> {
  await connectDB();
  const filter = status ? { status } : {};
  const docs = await Poem.find(filter)
    .sort({ updatedAt: -1 })
    .populate("collectionId", "title")
    .lean<LeanAdminPoem[]>();

  return docs.map((doc) => ({
    id: String(doc._id),
    title: doc.title,
    slug: doc.slug,
    status: doc.status,
    featured: Boolean(doc.featured),
    views: doc.views ?? 0,
    likes: doc.likes ?? 0,
    collectionTitle:
      doc.collectionId &&
      typeof doc.collectionId === "object" &&
      "title" in doc.collectionId
        ? doc.collectionId.title
        : null,
    publishedAt: doc.publishedAt ? new Date(doc.publishedAt).toISOString() : null,
    scheduledFor: doc.scheduledFor
      ? new Date(doc.scheduledFor).toISOString()
      : null,
    updatedAt: new Date(doc.updatedAt).toISOString(),
  }));
}

export async function getPoemForEdit(id: string): Promise<PoemEditData | null> {
  if (!/^[a-f0-9]{24}$/i.test(id)) return null;
  await connectDB();
  const doc = await Poem.findById(id).lean<PoemDoc>();
  if (!doc) return null;
  return {
    id: String(doc._id),
    title: doc.title,
    content: doc.content,
    tags: doc.tags ?? [],
    featured: Boolean(doc.featured),
    status: doc.status,
    coverImage: doc.coverImage ?? "",
    collectionId: doc.collectionId ? String(doc.collectionId) : null,
    scheduledFor: doc.scheduledFor
      ? new Date(doc.scheduledFor).toISOString()
      : null,
  };
}

export async function getTopPoems(): Promise<{
  topViewed: { title: string; slug: string; views: number }[];
  topLiked: { title: string; slug: string; likes: number }[];
}> {
  await connectDB();
  const [topViewed, topLiked] = await Promise.all([
    Poem.find({ status: "published" })
      .sort({ views: -1 })
      .limit(10)
      .select("title slug views")
      .lean<{ title: string; slug: string; views: number }[]>(),
    Poem.find({ status: "published" })
      .sort({ likes: -1 })
      .limit(10)
      .select("title slug likes")
      .lean<{ title: string; slug: string; likes: number }[]>(),
  ]);
  return {
    topViewed: topViewed.map((p) => ({
      title: p.title,
      slug: p.slug,
      views: p.views ?? 0,
    })),
    topLiked: topLiked.map((p) => ({
      title: p.title,
      slug: p.slug,
      likes: p.likes ?? 0,
    })),
  };
}

/** Promotes any scheduled poems whose time has arrived. Called on admin load. */
export async function publishDuePoems(): Promise<number> {
  await connectDB();
  const now = new Date();
  const result = await Poem.updateMany(
    { status: "scheduled", scheduledFor: { $lte: now } },
    { $set: { status: "published", publishedAt: now } },
  );
  return result.modifiedCount ?? 0;
}
