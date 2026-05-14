import type { Metadata } from "next";
import { PoemCard } from "@/components/poem-card";
import { PoemsFilter } from "@/components/poems-filter";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { getAllTags, getPublishedPoems } from "@/lib/data/poems";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Poems",
  description: "Browse every published poem on PGpoetry — search by title, line, or tag.",
};

type SearchParams = Promise<{
  q?: string;
  tag?: string;
  page?: string;
  sort?: string;
}>;

export default async function PoemsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Number.parseInt(params.page ?? "1", 10) || 1;
  const sort = params.sort === "popular" ? "popular" : "recent";

  const [result, tags] = await Promise.all([
    getPublishedPoems({
      q: params.q,
      tag: params.tag,
      page,
      perPage: 12,
      sort,
    }),
    getAllTags(),
  ]);

  function hrefFor(nextPage: number): string {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.tag) sp.set("tag", params.tag);
    if (params.sort) sp.set("sort", params.sort);
    sp.set("page", String(nextPage));
    return `/poems?${sp.toString()}`;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">Poems</h1>
        <p className="text-muted-foreground mt-1">
          {result.total} published {result.total === 1 ? "poem" : "poems"}
        </p>
      </header>

      <div className="mb-8">
        <PoemsFilter tags={tags} activeTag={params.tag} query={params.q} />
      </div>

      {result.poems.length === 0 ? (
        <EmptyState
          title="No poems found"
          description={
            params.q || params.tag
              ? "Try a different search or clear your filters."
              : "No poems have been published yet — check back soon."
          }
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
