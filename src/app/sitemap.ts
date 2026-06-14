import type { MetadataRoute } from "next";
import { getAllPublishedSlugs, getAllTags } from "@/lib/data/poems";
import { getCollections } from "@/lib/data/collections";
import { SITE_URL } from "@/lib/seo";

/** Tags below this poem count are noindex, so they're left out of the sitemap. */
const MIN_INDEXABLE_TAG = 3;

export const dynamic = "force-dynamic";
export const revalidate = 3600; // refresh hourly at most

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [poems, collections, tags] = await Promise.all([
    getAllPublishedSlugs(),
    getCollections(),
    getAllTags(),
  ]);

  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE_URL}/poems`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/collections`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const poemEntries: MetadataRoute.Sitemap = poems.map((p) => ({
    url: `${SITE_URL}/poems/${p.slug}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const collectionEntries: MetadataRoute.Sitemap = collections.map((c) => ({
    url: `${SITE_URL}/collections/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // Only tags substantial enough to be indexable (matches the tag page's rule).
  const tagEntries: MetadataRoute.Sitemap = tags
    .filter((t) => t.count >= MIN_INDEXABLE_TAG)
    .map((t) => ({
      url: `${SITE_URL}/tags/${encodeURIComponent(t.tag)}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    }));

  return [...staticEntries, ...poemEntries, ...collectionEntries, ...tagEntries];
}
