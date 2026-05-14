import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PoemCard } from "@/components/poem-card";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { getCollectionBySlug } from "@/lib/data/collections";
import { getPublishedPoems } from "@/lib/data/poems";
import { env } from "@/lib/env";

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
  if (!collection) return { title: "Collection not found" };
  return {
    title: collection.title,
    description:
      collection.description ||
      `A curated collection of poems on ${env.SITE_NAME}.`,
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
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
