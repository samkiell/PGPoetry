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
        <div className="mb-4 text-center">
          <Link
            href={`/collections/${poem.collection.slug}`}
            className="text-primary text-xs font-medium uppercase tracking-[0.2em] hover:underline"
          >
            {poem.collection.title}
          </Link>
        </div>
      ) : null}

      <div className="bg-card text-card-foreground border-border/60 relative overflow-hidden rounded-2xl border shadow-md transition-all duration-300 hover:shadow-lg">
        {poem.coverImage ? (
          <div className="relative aspect-video w-full overflow-hidden border-b">
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

        <div className="px-6 py-10 sm:px-12 sm:py-16">
          <div className="flex flex-col items-center text-center">
            <h1 className="font-serif text-3xl font-semibold leading-tight sm:text-5xl">
              {poem.title}
            </h1>

            <div className="text-muted-foreground mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs uppercase tracking-wider">
              {poem.publishedAt ? <span>{formatDate(poem.publishedAt)}</span> : null}
              <span className="h-3 w-px bg-border hidden sm:block" />
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" /> {poem.readingMinutes} min read
              </span>
              <span className="h-3 w-px bg-border hidden sm:block" />
              <span className="inline-flex items-center gap-1">
                <Heart className="size-3" /> {poem.likes} likes
              </span>
              <span className="h-3 w-px bg-border hidden sm:block" />
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3" /> {poem.views} views
              </span>
            </div>

            {/* Elegant Divider Ornament */}
            <div className="my-8 flex items-center justify-center gap-4 w-full max-w-[200px]">
              <span className="h-px bg-border flex-1" />
              <span className="text-primary text-lg leading-none">❦</span>
              <span className="h-px bg-border flex-1" />
            </div>
          </div>

          {/* The poem itself — HTML from the editor, or normalised legacy text. */}
          <div className="mx-auto flex justify-center w-full my-6">
            <div
              className="poem-content w-fit max-w-full text-left font-serif leading-relaxed"
              dangerouslySetInnerHTML={{ __html: poemContentToHtml(poem.content) }}
            />
          </div>

          <div className="flex flex-col items-center justify-center mt-12 border-t pt-8">
            <p className="text-muted-foreground font-serif italic text-base">
              ©PGpoetry ✍
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-6">
        {poem.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2 justify-center">
            {poem.tags.map((tag) => (
              <Badge key={tag} variant="secondary" asChild>
                <Link href={`/poems?tag=${encodeURIComponent(tag)}`}>{tag}</Link>
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-center gap-3 border-t pt-6">
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
