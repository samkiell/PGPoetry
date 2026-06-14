import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RotatingVerse } from "@/components/rotating-verse";
import { PoemCard } from "@/components/poem-card";
import { EmptyState } from "@/components/empty-state";
import { JsonLd } from "@/components/json-ld";
import { getFeaturedPoems, getLatestPoems } from "@/lib/data/poems";
import { getFeaturedCollections } from "@/lib/data/collections";
import { SITE_NAME, SITE_URL, SITE_LOGO } from "@/lib/seo";

// Home reflects newly published poems, so render on demand.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${SITE_NAME} — Original Poetry, Emotional & Short Poems Online`,
  description:
    "Read original, emotion-driven poetry online — short poems on faith, hope, love, and resilience. Discover new verses, collect favorites, and share the lines that find you.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: `${SITE_NAME} — Original Poetry Online`,
    description:
      "Original, emotion-driven poetry — short poems on faith, hope, love, and resilience.",
    url: SITE_URL,
    type: "website",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Original Poetry Online`,
    description:
      "Original, emotion-driven poetry — short poems on faith, hope, love, and resilience.",
  },
};

export default async function HomePage() {
  const [featured, latest, collections] = await Promise.all([
    getFeaturedPoems(3),
    getLatestPoems(6),
    getFeaturedCollections(3),
  ]);

  const hasAnyPoems = featured.length > 0 || latest.length > 0;

  // WebSite schema with a SearchAction so Google can offer a sitelinks search
  // box pointing at the on-site search (/poems?q=).
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: "Original, emotion-driven poetry online.",
    inLanguage: "en",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: SITE_LOGO },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/poems?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <JsonLd data={websiteJsonLd} />
      {/* Hero */}
      <section className="flex flex-col items-center gap-8 pb-12 pt-10 text-center sm:gap-10 sm:pb-16 sm:pt-16">
        <div className="flex flex-col items-center gap-4 sm:gap-6">
          <RotatingVerse />
          <h1 className="font-serif text-[2.5rem] font-semibold leading-[1.1] sm:text-6xl">
            Read it. Feel it.<br className="hidden sm:block" /> Carry it.
          </h1>
          <p className="text-muted-foreground max-w-xl text-base sm:text-lg">
            A minimalist, emotion-driven space for original poetry — and the
            lines that find you when you need them.
          </p>
        </div>
        <div className="flex w-full max-w-xs flex-col items-stretch gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
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
