import type { PoemStatus } from "@/models/Poem";

/**
 * Plain, fully-serializable shapes returned by the data layer.
 * Mongoose documents (ObjectId, Date instances on lean docs) are normalised
 * here so they can cross the server/client component boundary safely.
 */

export interface PoemListItem {
  id: string;
  title: string;
  slug: string;
  /** Signature-stripped excerpt, ready to render. */
  excerpt: string;
  /** Whether the full poem is longer than the excerpt. */
  truncated: boolean;
  tags: string[];
  featured: boolean;
  coverImage: string;
  likes: number;
  views: number;
  readingTime: string;
  publishedAt: string | null;
  collection: { title: string; slug: string } | null;
}

export interface PoemDetail {
  id: string;
  title: string;
  slug: string;
  /** Full content, signature stripped (the UI renders the signature itself). */
  content: string;
  tags: string[];
  featured: boolean;
  status: PoemStatus;
  coverImage: string;
  likes: number;
  views: number;
  wordCount: number;
  readingTime: string;
  publishedAt: string | null;
  createdAt: string;
  collection: { title: string; slug: string } | null;
}

export interface CollectionItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  featured: boolean;
  poemCount: number;
}

export interface PaginatedPoems {
  poems: PoemListItem[];
  total: number;
  page: number;
  pageCount: number;
  perPage: number;
}
