import type { Metadata } from "next";
import Link from "next/link";
import { Library } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { getCollections } from "@/lib/data/collections";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Collections",
  description: "Curated series of poems on PGpoetry — grouped by theme and mood.",
};

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
          Collections
        </h1>
        <p className="text-muted-foreground mt-1">
          Curated series — poems gathered by theme and mood.
        </p>
      </header>

      {collections.length === 0 ? (
        <EmptyState
          title="No collections yet"
          description="Collections grouped from the admin studio will show up here."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.slug}`}
              className="bg-card group flex flex-col gap-3 rounded-xl border p-6 transition-shadow hover:shadow-md"
            >
              <span className="bg-muted text-muted-foreground grid size-10 place-items-center rounded-lg">
                <Library className="size-5" />
              </span>
              <h2 className="font-serif text-xl font-semibold group-hover:text-primary">
                {collection.title}
              </h2>
              {collection.description ? (
                <p className="text-muted-foreground line-clamp-3 text-sm">
                  {collection.description}
                </p>
              ) : null}
              <p className="text-muted-foreground mt-auto text-xs font-medium uppercase tracking-wide">
                {collection.poemCount} poem
                {collection.poemCount === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
