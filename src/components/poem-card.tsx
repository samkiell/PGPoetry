import Link from "next/link";
import { Clock, Eye, Heart, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { PoemListItem } from "@/types/content";

export function PoemCard({ poem }: { poem: PoemListItem }) {
  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-3 pt-6">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/poems/${poem.slug}`}>
            <h3 className="font-serif text-xl leading-snug font-semibold transition-colors group-hover:text-primary">
              {poem.title}
            </h3>
          </Link>
          {poem.featured ? (
            <Star className="size-4 shrink-0 fill-primary text-primary" />
          ) : null}
        </div>

        {poem.collection ? (
          <Link
            href={`/collections/${poem.collection.slug}`}
            className="text-muted-foreground text-xs font-medium uppercase tracking-wide hover:text-primary"
          >
            {poem.collection.title}
          </Link>
        ) : null}

        <p className="poem-body text-muted-foreground line-clamp-4 text-sm leading-relaxed">
          {poem.excerpt}
        </p>

        {poem.truncated ? (
          <Link
            href={`/poems/${poem.slug}`}
            className="text-primary text-sm font-medium hover:underline"
          >
            Read more →
          </Link>
        ) : null}

        {poem.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {poem.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" asChild>
                <Link href={`/poems?tag=${encodeURIComponent(tag)}`}>
                  {tag}
                </Link>
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="text-muted-foreground gap-4 border-t py-3 text-xs">
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" /> {poem.readingTime}
        </span>
        <span className="inline-flex items-center gap-1">
          <Heart className="size-3.5" /> {poem.likes}
        </span>
        <span className="inline-flex items-center gap-1">
          <Eye className="size-3.5" /> {poem.views}
        </span>
      </CardFooter>
    </Card>
  );
}
