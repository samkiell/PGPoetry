import "server-only";
import { connectDB } from "@/lib/db";
import { Poem, type PoemDoc, type PoemStatus } from "@/models/Poem";
import { User, type UserRole } from "@/models/User";
import { Comment } from "@/models/Comment";
import { Like } from "@/models/Like";
import { Favorite } from "@/models/Favorite";

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
  query?: string,
): Promise<AdminPoemRow[]> {
  await connectDB();
  const filter: Record<string, unknown> = status ? { status } : {};
  const q = query?.trim();
  if (q) {
    // Match a word that starts with the query across title + content.
    const rx = new RegExp("\\b" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ title: rx }, { content: rx }];
  }
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

/* -------------------------------------------------------------------------- */
/*  Analytics dashboard                                                        */
/* -------------------------------------------------------------------------- */

export interface AnalyticsDay {
  date: string; // YYYY-MM-DD
  likes: number;
  comments: number;
  signups: number;
}

export interface AnalyticsTopPoem {
  title: string;
  slug: string;
  views: number;
  likes: number;
}

export interface AnalyticsTag {
  tag: string;
  poems: number;
  likes: number;
  views: number;
}

export interface Analytics {
  totals: {
    poems: number;
    published: number;
    views: number;
    likes: number;
    comments: number;
    readers: number;
    favorites: number;
  };
  /** Engagement rates, as percentages (0–100). */
  rates: { likePerView: number; commentPerView: number };
  /** Counts within the trailing 30 days. */
  last30: { likes: number; comments: number; signups: number };
  /** Daily series for the trailing 30 days (oldest → newest). */
  series: AnalyticsDay[];
  topPoems: AnalyticsTopPoem[];
  topTags: AnalyticsTag[];
}

/** Buckets timestamped docs into a date→count map (UTC day keys). */
function countByDay(
  rows: { _id: string; count: number }[],
): Map<string, number> {
  return new Map(rows.map((r) => [r._id, r.count]));
}

export async function getAnalytics(): Promise<Analytics> {
  await connectDB();

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 29);
  since.setUTCHours(0, 0, 0, 0);

  const dayGroup = [
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" },
        },
        count: { $sum: 1 },
      },
    },
  ];

  const [
    byStatus,
    viewsLikes,
    totalComments,
    totalReaders,
    totalFavorites,
    likesByDay,
    commentsByDay,
    signupsByDay,
    last30Counts,
    topPoemsRaw,
    tagRows,
  ] = await Promise.all([
    Poem.aggregate<{ _id: PoemStatus; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Poem.aggregate<{ _id: null; views: number; likes: number }>([
      { $group: { _id: null, views: { $sum: "$views" }, likes: { $sum: "$likes" } } },
    ]),
    Comment.countDocuments(),
    User.countDocuments(),
    Favorite.countDocuments(),
    Like.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: since } } },
      ...dayGroup,
    ]),
    Comment.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: since } } },
      ...dayGroup,
    ]),
    User.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: since } } },
      ...dayGroup,
    ]),
    Promise.all([
      Like.countDocuments({ createdAt: { $gte: since } }),
      Comment.countDocuments({ createdAt: { $gte: since } }),
      User.countDocuments({ createdAt: { $gte: since } }),
    ]),
    Poem.find({ status: "published" })
      .sort({ views: -1 })
      .limit(8)
      .select("title slug views likes")
      .lean<{ title: string; slug: string; views: number; likes: number }[]>(),
    Poem.aggregate<AnalyticsTag>([
      { $match: { status: "published" } },
      { $unwind: "$tags" },
      {
        $group: {
          _id: "$tags",
          poems: { $sum: 1 },
          likes: { $sum: "$likes" },
          views: { $sum: "$views" },
        },
      },
      { $project: { _id: 0, tag: "$_id", poems: 1, likes: 1, views: 1 } },
      { $sort: { likes: -1, views: -1 } },
      { $limit: 8 },
    ]),
  ]);

  const counts = new Map(byStatus.map((s) => [s._id, s.count]));
  const published = counts.get("published") ?? 0;
  const drafts = counts.get("draft") ?? 0;
  const scheduled = counts.get("scheduled") ?? 0;
  const views = viewsLikes[0]?.views ?? 0;
  const likes = viewsLikes[0]?.likes ?? 0;

  const likeMap = countByDay(likesByDay);
  const commentMap = countByDay(commentsByDay);
  const signupMap = countByDay(signupsByDay);

  // Build a dense 30-day series (zero-filled) so the chart has no gaps.
  const series: AnalyticsDay[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(since);
    d.setUTCDate(since.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    series.push({
      date: key,
      likes: likeMap.get(key) ?? 0,
      comments: commentMap.get(key) ?? 0,
      signups: signupMap.get(key) ?? 0,
    });
  }

  const [last30Likes, last30Comments, last30Signups] = last30Counts;
  const round1 = (n: number) => Math.round(n * 10) / 10;

  return {
    totals: {
      poems: published + drafts + scheduled,
      published,
      views,
      likes,
      comments: totalComments,
      readers: totalReaders,
      favorites: totalFavorites,
    },
    rates: {
      likePerView: views > 0 ? round1((likes / views) * 100) : 0,
      commentPerView: views > 0 ? round1((totalComments / views) * 100) : 0,
    },
    last30: {
      likes: last30Likes,
      comments: last30Comments,
      signups: last30Signups,
    },
    series,
    topPoems: topPoemsRaw.map((p) => ({
      title: p.title,
      slug: p.slug,
      views: p.views ?? 0,
      likes: p.likes ?? 0,
    })),
    topTags: tagRows.map((t) => ({
      tag: t.tag,
      poems: t.poems,
      likes: t.likes ?? 0,
      views: t.views ?? 0,
    })),
  };
}

/** Promotes any scheduled poems whose time has arrived. Called on admin load. */
export async function publishDuePoems(): Promise<number> {
  await connectDB();
  const now = new Date();

  // Capture which poems are about to go live so we can broadcast each one.
  const due = await Poem.find({
    status: "scheduled",
    scheduledFor: { $lte: now },
  })
    .select("_id")
    .lean();

  if (due.length === 0) return 0;

  const result = await Poem.updateMany(
    { status: "scheduled", scheduledFor: { $lte: now } },
    { $set: { status: "published", publishedAt: now } },
  );

  // Announce each newly published poem. The broadcast is idempotent.
  const { broadcastNewPoem } = await import("@/lib/email/broadcast");
  const { getRequestOrigin } = await import("@/lib/request-origin");
  const origin = await getRequestOrigin();
  for (const poem of due) {
    void broadcastNewPoem(String(poem._id), origin);
  }

  return result.modifiedCount ?? 0;
}

/* -------------------------------------------------------------------------- */
/*  Users — admin management                                                  */
/* -------------------------------------------------------------------------- */

export interface AdminUserRow {
  id: string;
  name: string;
  username: string;
  email: string;
  image: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

/**
 * Coerces a value to an ISO string, falling back to `fallback` when the value
 * is missing or unparseable. Auth.js's MongoDB adapter inserts user documents
 * through the raw driver, bypassing Mongoose's `timestamps`, so adapter-created
 * users have no `createdAt`/`updatedAt` — `new Date(undefined)` would otherwise
 * throw `RangeError: Invalid time value` and crash the page.
 */
function toISO(value: unknown, fallback: string): string {
  if (!value) return fallback;
  const date = new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

export async function getAllUsers(): Promise<AdminUserRow[]> {
  await connectDB();
  const users = await User.find()
    .select("name username email image role createdAt updatedAt")
    .sort({ createdAt: -1 })
    .lean();

  return users.map((user) => {
    // Every ObjectId encodes its creation time — a reliable fallback for
    // adapter-created users that lack Mongoose timestamps.
    const fromId = new Date(
      parseInt(String(user._id).substring(0, 8), 16) * 1000,
    ).toISOString();
    const createdAt = toISO(user.createdAt, fromId);
    return {
      id: String(user._id),
      name: user.name,
      username: user.username || "",
      email: user.email,
      image: user.image || "",
      role: user.role,
      createdAt,
      updatedAt: toISO(user.updatedAt, createdAt),
    };
  });
}

export async function updateUserRole(
  userId: string,
  role: UserRole,
): Promise<boolean> {
  await connectDB();
  const result = await User.updateOne({ _id: userId }, { role });
  return result.modifiedCount > 0;
}

export async function deleteUser(userId: string): Promise<boolean> {
  await connectDB();
  // Delete user and all their related data
  await Promise.all([
    User.deleteOne({ _id: userId }),
    Comment.deleteMany({ author: userId }),
    Like.deleteMany({ user: userId }),
  ]);
  return true;
}
