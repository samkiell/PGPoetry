import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";
import Link from "next/link";
import Image from "next/image";
import { Clock, Eye, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PoemCard } from "@/components/poem-card";
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
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {poem.collection ? (
        <Link
          href={`/collections/${poem.collection.slug}`}
          className="text-primary text-xs font-medium uppercase tracking-[0.2em] hover:underline"
        >
          {poem.collection.title}
        </Link>
      ) : null}

      <h1 className="font-serif mt-3 text-3xl font-semibold leading-tight sm:text-5xl">
        {poem.title}
      </h1>

      <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-4 text-sm">
        {poem.publishedAt ? <span>{formatDate(poem.publishedAt)}</span> : null}
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" /> {poem.readingMinutes} min read
        </span>
        <span className="inline-flex items-center gap-1">
          <Heart className="size-3.5" /> {poem.likes}
        </span>
        <span className="inline-flex items-center gap-1">
          <Eye className="size-3.5" /> {poem.views}
        </span>
      </div>

      {poem.coverImage ? (
        <div className="relative mt-8 aspect-video overflow-hidden rounded-xl">
          <Image
            src={poem.coverImage}
            alt={poem.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </div>
      ) : null}

      {/* The poem itself — HTML from the editor, or normalised legacy text. */}
      <div
        className="poem-content font-serif mt-10 text-lg leading-relaxed sm:text-xl"
        dangerouslySetInnerHTML={{ __html: poemContentToHtml(poem.content) }}
      />

      <p className="text-muted-foreground mt-8 font-serif text-base">
        ©PGpoetry ✍
      </p>

      {poem.tags.length > 0 ? (
        <div className="mt-8 flex flex-wrap gap-2 border-t pt-6">
          {poem.tags.map((tag) => (
            <Badge key={tag} variant="secondary" asChild>
              <Link href={`/poems?tag=${encodeURIComponent(tag)}`}>{tag}</Link>
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t pt-6">
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
      </div>

      <CommentSection
        poemId={poem.id}
        poemSlug={poem.slug}
        comments={comments}
        viewer={viewer ? { id: viewer.id, role: viewer.role } : null}
      />

      {related.length > 0 ? (
        <section className="mt-16 border-t pt-10">
          <h2 className="font-serif mb-6 text-2xl font-semibold">
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
