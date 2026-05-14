import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PoemCard } from "@/components/poem-card";
import { EmptyState } from "@/components/empty-state";
import { getFeaturedPoems, getLatestPoems } from "@/lib/data/poems";
import { getFeaturedCollections } from "@/lib/data/collections";

// Home reflects newly published poems, so render on demand.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, latest, collections] = await Promise.all([
    getFeaturedPoems(3),
    getLatestPoems(6),
    getFeaturedCollections(3),
  ]);

  const hasAnyPoems = featured.length > 0 || latest.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 py-20 text-center sm:py-28">
        <span className="text-muted-foreground inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.3em]">
          <Sparkles className="size-3.5" /> PGpoetry
        </span>
        <h1 className="font-serif text-4xl font-semibold leading-tight sm:text-6xl">
          Every verse, a<br className="hidden sm:block" /> priceless gift.
        </h1>
        <p className="text-muted-foreground max-w-xl text-lg">
          A minimalist, emotion-driven space for original poetry. Read it,
          collect it, and carry the lines that find you.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/poems">
              Explore poems <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/collections">Browse collections</Link>
          </Button>
        </div>
      </section>

      {!hasAnyPoems ? (
        <section className="pb-24">
          <EmptyState
            title="No poems published yet"
            description="Once poems are published from the admin studio, they'll appear here."
          />
        </section>
      ) : null}

      {/* Featured */}
      {featured.length > 0 ? (
        <section className="pb-20">
          <SectionHeading
            title="Featured poems"
            href="/poems"
            linkLabel="All poems"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((poem) => (
              <PoemCard key={poem.id} poem={poem} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Collections */}
      {collections.length > 0 ? (
        <section className="pb-20">
          <SectionHeading
            title="Collections"
            href="/collections"
            linkLabel="All collections"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.slug}`}
                className="bg-card group flex flex-col gap-2 rounded-xl border p-6 transition-shadow hover:shadow-md"
              >
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  {collection.poemCount} poem
                  {collection.poemCount === 1 ? "" : "s"}
                </p>
                <h3 className="font-serif text-xl font-semibold group-hover:text-primary">
                  {collection.title}
                </h3>
                {collection.description ? (
                  <p className="text-muted-foreground line-clamp-2 text-sm">
                    {collection.description}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Latest */}
      {latest.length > 0 ? (
        <section className="pb-24">
          <SectionHeading
            title="Latest"
            href="/poems"
            linkLabel="See more"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((poem) => (
              <PoemCard key={poem.id} poem={poem} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SectionHeading({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <h2 className="font-serif text-2xl font-semibold sm:text-3xl">{title}</h2>
      <Link
        href={href}
        className="text-primary text-sm font-medium hover:underline"
      >
        {linkLabel} →
      </Link>
    </div>
  );
}
