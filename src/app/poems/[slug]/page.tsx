import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";
import Link from "next/link";
import Image from "next/image";
import { Clock, Eye, Heart } from "lucide-react";
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

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const poem = await getPoemBySlug(slug);
  if (!poem) return { title: "Poem not found" };

  const description = poem.content.slice(0, 160).replace(/\s+/g, " ").trim();
  const url = `${env.SITE_URL}/poems/${poem.slug}`;

  return {
    title: poem.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: poem.title,
      description,
      url,
      type: "article",
      images: poem.coverImage
        ? [{ url: poem.coverImage }]
        : [{ url: `/poems/${poem.slug}/opengraph-image` }],
    },
    twitter: {
      card: "summary_large_image",
      title: poem.title,
      description,
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

  // Count the view after the response is streamed, so it never blocks render.
  after(async () => {
    await incrementPoemViews(poem.id);
  });

  return (
    <article className="poem-page mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
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
        <h1 className="font-serif text-4xl font-medium leading-[1.1] tracking-tight sm:text-6xl">
          {poem.title}
        </h1>

        <div className="poem-meta mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          {poem.publishedAt ? <span>{formatDate(poem.publishedAt)}</span> : null}
          <span>
            <Clock className="mr-1 inline size-3 align-[-2px]" />
            {poem.readingMinutes} min read
          </span>
          <span className="reading-hide">
            <Heart className="mr-1 inline size-3 align-[-2px]" />
            {poem.likes}
          </span>
          <span className="reading-hide">
            <Eye className="mr-1 inline size-3 align-[-2px]" />
            {poem.views}
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

      <Fleuron />

      {/* Signature */}
      <p className="text-muted-foreground text-center font-serif text-sm italic">
        ©PGpoetry ✍
      </p>

      {/* Tags (kept visible in reading mode — they're part of the poem framing) */}
      {poem.tags.length > 0 ? (
        <div className="reading-hide mt-12 flex flex-wrap justify-center gap-2">
          {poem.tags.map((tag) => (
            <Badge key={tag} variant="secondary" asChild>
              <Link href={`/poems?tag=${encodeURIComponent(tag)}`}>{tag}</Link>
            </Badge>
          ))}
        </div>
      ) : null}

      {/* Engagement + reading mode toggle */}
      <div className="reading-hide mt-10 flex flex-wrap items-center justify-center gap-2 border-t pt-8">
        <LikeButton
          poemId={poem.id}
          initialLiked={engagement.liked}
          initialCount={engagement.likeCount}
        />
        <FavoriteButton
          poemId={poem.id}
          initialFavorited={engagement.favorited}
          isLoggedIn={Boolean(viewer)}
        />
        <ShareButton title={poem.title} url={shareUrl} />
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <PoemCard key={p.id} poem={p} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
