import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";
import Link from "next/link";
import Image from "next/image";
import { Clock, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PoemCard } from "@/components/poem-card";
import { Fleuron } from "@/components/fleuron";
import { ReadingModeToggle } from "@/components/reading-mode-toggle";
import { LikeButton } from "@/components/engagement/like-button";
import { FavoriteButton } from "@/components/engagement/favorite-button";
import { ShareButton } from "@/components/engagement/share-button";
import { CommentSection } from "@/components/engagement/comment-section";
import {
  getPoemBySlug,
  getRelatedPoems,
  incrementPoemViews,
} from "@/lib/data/poems";
import { getEngagementState } from "@/lib/data/engagement";
import { getComments } from "@/lib/data/comments";
import { getCurrentUser } from "@/lib/session";
import { formatDate, poemContentToHtml } from "@/lib/utils";
import { env } from "@/lib/env";
import { AUTHOR_NAME, SITE_NAME, SITE_URL, metaDescription } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const poem = await getPoemBySlug(slug);
  if (!poem) return { title: "Poem not found", robots: { index: false } };

  const description = metaDescription(poem.content);
  const url = `${SITE_URL}/poems/${poem.slug}`;
  const ogImage = poem.coverImage || `${url}/opengraph-image`;

  return {
    title: poem.title,
    description,
    keywords: poem.tags,
    authors: [{ name: AUTHOR_NAME }],
    alternates: { canonical: url },
    openGraph: {
      title: `${poem.title} — ${SITE_NAME}`,
      description,
      url,
      type: "article",
      siteName: SITE_NAME,
      publishedTime: poem.publishedAt ?? poem.createdAt,
      authors: [AUTHOR_NAME],
      tags: poem.tags,
      images: [{ url: ogImage, width: 1200, height: 630, alt: poem.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${poem.title} — ${SITE_NAME}`,
      description,
      images: [ogImage],
    },
  };
}

export default async function PoemPage({ params }: { params: Params }) {
  const { slug } = await params;
  const poem = await getPoemBySlug(slug);
  if (!poem) notFound();

  const [related, engagement, comments, viewer] = await Promise.all([
    getRelatedPoems(poem.id, poem.tags, 3),
    getEngagementState(poem.id),
    getComments(poem.id),
    getCurrentUser(),
  ]);

  const shareUrl = `${env.SITE_URL}/poems/${poem.slug}`;
  const ogImage = poem.coverImage || `${shareUrl}/opengraph-image`;

  // Schema.org Poem (a subtype of CreativeWork) — drives rich results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Poem",
    name: poem.title,
    headline: poem.title,
    description: metaDescription(poem.content),
    url: shareUrl,
    image: ogImage,
    inLanguage: "en",
    datePublished: poem.publishedAt ?? poem.createdAt,
    dateModified: poem.publishedAt ?? poem.createdAt,
    keywords: poem.tags.join(", "),
    wordCount: poem.wordCount,
    author: { "@type": "Person", name: AUTHOR_NAME, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/images/pg_logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": shareUrl },
    ...(poem.collection
      ? { isPartOf: { "@type": "CreativeWorkSeries", name: poem.collection.title } }
      : {}),
  };

  // Count the view after the response is streamed, so it never blocks render.
  after(async () => {
    await incrementPoemViews(poem.id);
  });

  return (
    <article className="poem-page mx-auto max-w-2xl px-4 pt-10 pb-16 sm:px-6 sm:pt-14 sm:pb-24">
      <JsonLd data={jsonLd} />
      {/* Collection eyebrow */}
      {poem.collection ? (
        <div className="reading-hide mb-6 text-center">
          <Link
            href={`/collections/${poem.collection.slug}`}
            className="text-primary text-[10px] font-medium uppercase tracking-[0.3em] hover:underline"
          >
            {poem.collection.title}
          </Link>
        </div>
      ) : null}

      {/* Title */}
      <header className="text-center">
        <h1 className="font-serif text-3xl font-medium leading-[1.1] tracking-tight sm:text-6xl">
          {poem.title}
        </h1>

        <div className="poem-meta mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:gap-x-5">
          {poem.publishedAt ? <span>{formatDate(poem.publishedAt)}</span> : null}
          <span>
            <Clock className="mr-1 inline size-3 align-[-2px]" />
            {poem.readingTime} read
          </span>
        </div>
      </header>

      {/* Cover image */}
      {poem.coverImage ? (
        <div className="relative mx-auto mt-12 aspect-video w-full max-w-xl overflow-hidden rounded-md">
          <Image
            src={poem.coverImage}
            alt={poem.title}
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            className="object-cover"
            priority
          />
        </div>
      ) : null}

      <Fleuron />

      {/* The poem itself */}
      <div
        className="poem-content"
        dangerouslySetInnerHTML={{ __html: poemContentToHtml(poem.content) }}
      />

      <Fleuron className="my-6" />

      {/* Signature — the PG monogram marks the poem as PGpoetry's. */}
      <div className="flex justify-center">
        <Image
          src="/images/pg_logo.png"
          alt="PGpoetry"
          width={36}
          height={36}
          className="size-9 opacity-90"
        />
      </div>

      {/* Tags (kept visible in reading mode — they're part of the poem framing) */}
      {poem.tags.length > 0 ? (
        <div className="reading-hide mt-6 flex flex-wrap justify-start gap-2">
          {poem.tags.map((tag) => (
            <Badge key={tag} variant="secondary" asChild>
              <Link href={`/tags/${encodeURIComponent(tag)}`}>{tag}</Link>
            </Badge>
          ))}
        </div>
      ) : null}

      {/* Engagement — like, views, save, share on one line */}
      <div className="reading-hide mt-8 flex flex-wrap items-center justify-center gap-2 border-t pt-6">
        <LikeButton
          poemId={poem.id}
          initialLiked={engagement.liked}
          initialCount={engagement.likeCount}
        />
        <span className="text-muted-foreground bg-background inline-flex h-11 items-center gap-2 rounded-md border px-4 text-base shadow-sm">
          <Eye className="size-5" />
          {poem.views}
        </span>
        <FavoriteButton
          poemId={poem.id}
          initialFavorited={engagement.favorited}
          isLoggedIn={Boolean(viewer)}
        />
        <ShareButton title={poem.title} url={shareUrl} slug={poem.slug} />
        <span className="bg-border mx-1 h-5 w-px" />
        <ReadingModeToggle />
      </div>

      {/* Comments */}
      <div className="reading-hide">
        <CommentSection
          poemId={poem.id}
          poemSlug={poem.slug}
          comments={comments}
          viewer={viewer ? { id: viewer.id, role: viewer.role } : null}
        />
      </div>

      {/* Related poems */}
      {related.length > 0 ? (
        <section className="reading-hide mt-20 border-t pt-12">
          <h2 className="font-serif mb-8 text-center text-xl font-medium tracking-tight">
            More like this
          </h2>
          {/* Break out of the article's max-w-2xl on large screens (bounded so
              it never causes horizontal overflow) so the cards get more room. */}
          <div className="xl:-mx-60 xl:max-w-6xl">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {related.map((p) => (
                <PoemCard key={p.id} poem={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </article>
  );
}
