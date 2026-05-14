import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { getTopPoems } from "@/lib/data/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Analytics" };

export default async function AdminAnalyticsPage() {
  const { topViewed, topLiked } = await getTopPoems();
  const hasData = topViewed.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-2xl font-semibold">Analytics</h1>

      {!hasData ? (
        <EmptyState
          title="No data yet"
          description="Once poems are published and readers start engaging, you'll see your top poems here."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="size-4" /> Most viewed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-col gap-2">
                {topViewed.map((poem, i) => (
                  <li
                    key={poem.slug}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="text-muted-foreground w-4 text-right">
                        {i + 1}
                      </span>
                      <Link
                        href={`/poems/${poem.slug}`}
                        target="_blank"
                        className="truncate hover:text-primary"
                      >
                        {poem.title}
                      </Link>
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      {poem.views.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="size-4" /> Most liked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-col gap-2">
                {topLiked.map((poem, i) => (
                  <li
                    key={poem.slug}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="text-muted-foreground w-4 text-right">
                        {i + 1}
                      </span>
                      <Link
                        href={`/poems/${poem.slug}`}
                        target="_blank"
                        className="truncate hover:text-primary"
                      >
                        {poem.title}
                      </Link>
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      {poem.likes.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
