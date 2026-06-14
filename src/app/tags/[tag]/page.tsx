import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Hash } from "lucide-react";
import { PoemCard } from "@/components/poem-card";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { JsonLd } from "@/components/json-ld";
import { getPublishedPoems, getAllTags } from "@/lib/data/poems";
import { SITE_NAME, SITE_URL, titleizeTag } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Params = Promise<{ tag: string }>;
type SearchParams = Promise<{ page?: string }>;

/** Tags with fewer poems than this are noindex,follow to avoid thin content. */
const MIN_INDEXABLE = 3;

/** Tags are stored lowercased; the route param may arrive encoded. */
function normalizeTag(raw: string): string {
  return decodeURIComponent(raw).trim().toLowerCase();
}

/**
 * Hand-written, search-friendly descriptions for the highest-value themes.
 * Anything not listed gets a templated-but-specific fallback.
 */
const TAG_COPY: Record<string, string> = {
  faith:
    "Faith poems exploring belief, doubt, and trust — original verses for the seeking and the steadfast.",
  hope:
    "Hope poems for hard seasons — short, uplifting verses about light returning and beginnings in broken places.",
  prayer:
    "Prayer poems and verses for doubters and believers — quiet conversations with God put into poetry.",
  resilience:
    "Resilience poems about rising again — verses on endurance, scars, and strength forged in hard places.",
  love:
    "Love poems — tender, honest verses about longing, devotion, and the ache of the heart.",
  october:
    "October poems for a new month — seasonal verses on change, fresh starts, and quiet renewal.",
};

async function tagData(rawTag: string) {
  const tag = normalizeTag(rawTag);
  const allTags = await getAllTags();
  const match = allTags.find((t) => t.tag === tag);
  return { tag, count: match?.count ?? 0, exists: Boolean(match) };
}

function describeTag(tag: string, count: number): string {
  return (
    TAG_COPY[tag] ??
    `${titleizeTag(tag)} poems on ${SITE_NAME} — ${count} original verse${
      count === 1 ? "" : "s"
    } exploring ${tag}.`
  );
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { tag: rawTag } = await params;
  const { tag, count, exists } = await tagData(rawTag);

  if (!exists) return { title: "Tag not found", robots: { index: false } };

  const label = titleizeTag(tag);
  const title = `${label} Poems`;
  const description = describeTag(tag, count);
  const url = `${SITE_URL}/tags/${encodeURIComponent(tag)}`;

  return {
    title,
    description,
    keywords: [tag, `${tag} poems`, `${tag} poetry`],
    alternates: { canonical: url },
    // Thin tag pages stay out of the index but still pass link equity through.
    robots:
      count < MIN_INDEXABLE
        ? { index: false, follow: true }
        : { index: true, follow: true },
    openGraph: {
      title: `${title} — ${SITE_NAME}`,
      description,
      url,
      type: "website",
      siteName: SITE_NAME,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { tag: rawTag } = await params;
  const { page: pageParam } = await searchParams;
  const { tag, count, exists } = await tagData(rawTag);
  if (!exists) notFound();

  const page = Number.parseInt(pageParam ?? "1", 10) || 1;
  const result = await getPublishedPoems({ tag, page, perPage: 12 });
  const label = titleizeTag(tag);
  const url = `${SITE_URL}/tags/${encodeURIComponent(tag)}`;

  function hrefFor(nextPage: number): string {
    return nextPage <= 1 ? `/tags/${tag}` : `/tags/${tag}?page=${nextPage}`;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${label} Poems`,
    description: describeTag(tag, count),
    url,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Poems", item: `${SITE_URL}/poems` },
        { "@type": "ListItem", position: 3, name: `${label} Poems`, item: url },
      ],
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <JsonLd data={jsonLd} />
      <header className="mb-8">
        <p className="text-primary inline-flex items-center gap-1 text-xs font-medium uppercase tracking-[0.2em]">
          <Hash className="size-3" /> Tag
        </p>
        <h1 className="font-serif mt-2 text-3xl font-semibold sm:text-4xl">
          {label} Poems
        </h1>
        <p className="text-muted-foreground mt-3 max-w-2xl">
          {describeTag(tag, count)}
        </p>
        <p className="text-muted-foreground mt-2 text-sm">
          {result.total} poem{result.total === 1 ? "" : "s"} ·{" "}
          <Link href="/poems" className="hover:text-foreground underline">
            all poems
          </Link>
        </p>
      </header>

      {result.poems.length === 0 ? (
        <EmptyState
          title="No poems with this tag"
          description="Browse all poems instead — something there may resonate."
        />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {result.poems.map((poem) => (
              <PoemCard key={poem.id} poem={poem} />
            ))}
          </div>
          <div className="mt-12">
            <Pagination
              page={result.page}
              pageCount={result.pageCount}
              hrefFor={hrefFor}
            />
          </div>
        </>
      )}
    </div>
  );
}
