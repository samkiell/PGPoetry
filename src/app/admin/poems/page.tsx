import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { PoemRowActions } from "@/components/admin/poem-row-actions";
import { PoemStatusSelect } from "@/components/admin/poem-status-select";
import { PoemFeaturedToggle } from "@/components/admin/poem-featured-toggle";
import { PoemSearch } from "@/components/admin/poem-search";
import { getAdminPoems } from "@/lib/data/admin";
import { formatDate } from "@/lib/utils";
import type { PoemStatus } from "@/models/Poem";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Poems" };

const FILTERS: { label: string; value?: PoemStatus }[] = [
  { label: "All" },
  { label: "Published", value: "published" },
  { label: "Drafts", value: "draft" },
  { label: "Scheduled", value: "scheduled" },
];

export default async function AdminPoemsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const activeStatus = (["published", "draft", "scheduled"] as const).find(
    (s) => s === status,
  );
  const poems = await getAdminPoems(activeStatus, q);

  function filterHref(value?: PoemStatus): string {
    const params = new URLSearchParams();
    if (value) params.set("status", value);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/admin/poems?${qs}` : "/admin/poems";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold">Poems</h1>
        <Button asChild>
          <Link href="/admin/poems/new">
            <Plus className="size-4" /> New poem
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1">
          {FILTERS.map((filter) => {
            const active = filter.value === activeStatus;
            return (
              <Link
                key={filter.label}
                href={filterHref(filter.value)}
                className={
                  active
                    ? "bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm font-medium"
                    : "text-muted-foreground hover:bg-accent rounded-md px-3 py-1.5 text-sm font-medium"
                }
              >
                {filter.label}
              </Link>
            );
          })}
        </div>
        <PoemSearch />
      </div>

      {poems.length === 0 ? (
        <EmptyState
          title={q ? "No matching poems" : "No poems here"}
          description={
            q
              ? `Nothing matched “${q}”. Try a different search.`
              : "Poems you write will show up in this list."
          }
        >
          {q ? null : (
            <Button asChild size="sm" className="mt-2">
              <Link href="/admin/poems/new">Write a poem</Link>
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-left text-xs uppercase">
              <tr>
                <th className="px-4 py-2.5 font-medium">Title</th>
                <th className="hidden px-4 py-2.5 font-medium sm:table-cell">
                  Featured
                </th>
                <th className="hidden px-4 py-2.5 font-medium sm:table-cell">
                  Status
                </th>
                <th className="hidden px-4 py-2.5 font-medium md:table-cell">
                  Collection
                </th>
                <th className="hidden px-4 py-2.5 font-medium lg:table-cell">
                  Stats
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {poems.map((poem) => (
                <tr key={poem.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {/* Inline featured toggle on mobile (no dedicated col). */}
                      <span className="sm:hidden">
                        <PoemFeaturedToggle
                          poemId={poem.id}
                          featured={poem.featured}
                        />
                      </span>
                      <Link
                        href={`/admin/poems/${poem.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {poem.title}
                      </Link>
                    </div>
                    <div className="mt-1 sm:hidden">
                      <PoemStatusSelect poemId={poem.id} status={poem.status} />
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <PoemFeaturedToggle
                      poemId={poem.id}
                      featured={poem.featured}
                    />
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <PoemStatusSelect poemId={poem.id} status={poem.status} />
                    {poem.status === "scheduled" && poem.scheduledFor ? (
                      <p className="text-muted-foreground mt-1 text-xs">
                        {formatDate(poem.scheduledFor)}
                      </p>
                    ) : null}
                  </td>
                  <td className="text-muted-foreground hidden px-4 py-3 md:table-cell">
                    {poem.collectionTitle ?? "—"}
                  </td>
                  <td className="text-muted-foreground hidden px-4 py-3 lg:table-cell">
                    {poem.views} views · {poem.likes} likes
                  </td>
                  <td className="px-4 py-3 text-right">
                    <PoemRowActions
                      poemId={poem.id}
                      slug={poem.slug}
                      title={poem.title}
                      isPublished={poem.status === "published"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
