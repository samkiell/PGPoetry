import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PoemCard } from "@/components/poem-card";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { getCollectionBySlug } from "@/lib/data/collections";
import { getPublishedPoems } from "@/lib/data/poems";
import { JsonLd } from "@/components/json-ld";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ page?: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return { title: "Collection not found", robots: { index: false } };

  const url = `${SITE_URL}/collections/${collection.slug}`;
  const description =
    collection.description ||
    `${collection.title} — a curated collection of ${collection.poemCount} original poem${
      collection.poemCount === 1 ? "" : "s"
    } on ${SITE_NAME}.`;

  return {
    title: collection.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${collection.title} — ${SITE_NAME}`,
      description,
      url,
      type: "website",
      siteName: SITE_NAME,
      ...(collection.coverImage ? { images: [{ url: collection.coverImage }] } : {}),
    },
    twitter: { card: "summary_large_image", title: collection.title, description },
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const page = Number.parseInt(pageParam ?? "1", 10) || 1;
  const result = await getPublishedPoems({
    collectionSlug: slug,
    page,
    perPage: 12,
  });

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Collections",
        item: `${SITE_URL}/collections`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: collection.title,
        item: `${SITE_URL}/collections/${collection.slug}`,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <JsonLd data={breadcrumbJsonLd} />
      <header className="mb-8">
        <p className="text-primary text-xs font-medium uppercase tracking-[0.2em]">
          Collection
        </p>
        <h1 className="font-serif mt-2 text-3xl font-semibold sm:text-4xl">
          {collection.title}
        </h1>
        {collection.description ? (
          <p className="text-muted-foreground mt-3 max-w-2xl">
            {collection.description}
          </p>
        ) : null}
        <p className="text-muted-foreground mt-2 text-sm">
          {collection.poemCount} poem{collection.poemCount === 1 ? "" : "s"}
        </p>
      </header>

      {result.poems.length === 0 ? (
        <EmptyState
          title="No poems in this collection yet"
          description="Poems added to this collection will appear here."
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
              hrefFor={(p) => `/collections/${slug}?page=${p}`}
            />
          </div>
        </>
      )}
    </div>
  );
}
