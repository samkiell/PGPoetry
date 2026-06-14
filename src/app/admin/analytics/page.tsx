import type { Metadata } from "next";
import {
  Eye,
  Heart,
  MessageSquare,
  Users,
  Bookmark,
  FileText,
  TrendingUp,
  Hash,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { TrendChart, BarList } from "@/components/admin/analytics-charts";
import { getAnalytics } from "@/lib/data/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Analytics" };

export default async function AdminAnalyticsPage() {
  const a = await getAnalytics();
  const hasData = a.totals.published > 0 || a.totals.views > 0;

  const stats = [
    { label: "Published", value: a.totals.published, icon: FileText },
    { label: "Total views", value: a.totals.views, icon: Eye },
    { label: "Total likes", value: a.totals.likes, icon: Heart },
    { label: "Comments", value: a.totals.comments, icon: MessageSquare },
    { label: "Readers", value: a.totals.readers, icon: Users },
    { label: "Favorites", value: a.totals.favorites, icon: Bookmark },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-2xl font-semibold">Analytics</h1>

      {!hasData ? (
        <EmptyState
          title="No data yet"
          description="Once poems are published and readers start engaging, you'll see trends and top poems here."
        />
      ) : (
        <>
          {/* Headline stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {stats.map((s) => (
              <Card key={s.label}>
                <CardContent className="flex flex-col gap-1 py-4">
                  <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <s.icon className="size-3.5" /> {s.label}
                  </span>
                  <span className="text-2xl font-semibold tabular-nums">
                    {s.value.toLocaleString()}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Engagement rates */}
          <div className="grid gap-3 sm:grid-cols-3">
            <RateCard
              label="Like rate"
              value={`${a.rates.likePerView}%`}
              hint="likes per view"
            />
            <RateCard
              label="Comment rate"
              value={`${a.rates.commentPerView}%`}
              hint="comments per view"
            />
            <RateCard
              label="New readers"
              value={`+${a.last30.signups.toLocaleString()}`}
              hint="in the last 30 days"
            />
          </div>

          {/* Activity trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="size-4" /> Engagement over time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart series={a.series} />
              <p className="text-muted-foreground mt-4 text-xs">
                {a.last30.likes.toLocaleString()} likes ·{" "}
                {a.last30.comments.toLocaleString()} comments in the last 30 days
              </p>
            </CardContent>
          </Card>

          {/* Top poems + top tags */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="size-4" /> Top poems
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BarList
                  items={a.topPoems.map((p) => ({
                    label: p.title,
                    value: p.views,
                    href: `/poems/${p.slug}`,
                    sub: `${p.likes.toLocaleString()} ♥`,
                  }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Hash className="size-4" /> Top tags by likes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {a.topTags.length > 0 ? (
                  <BarList
                    items={a.topTags.map((t) => ({
                      label: t.tag,
                      value: t.likes,
                      href: `/tags/${encodeURIComponent(t.tag)}`,
                      sub: `${t.poems} ${t.poems === 1 ? "poem" : "poems"}`,
                    }))}
                  />
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Tag your poems to see which themes resonate.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function RateCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
        <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p>
      </CardContent>
    </Card>
  );
}
