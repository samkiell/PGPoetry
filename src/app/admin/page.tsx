import type { Metadata } from "next";
import Link from "next/link";
import {
  Clock,
  Eye,
  FileText,
  Heart,
  MessageSquare,
  PenLine,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminStats, getAdminPoems } from "@/lib/data/admin";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const [stats, recent] = await Promise.all([
    getAdminStats(),
    getAdminPoems(),
  ]);

  const cards = [
    { label: "Published", value: stats.published, icon: FileText },
    { label: "Drafts", value: stats.drafts, icon: PenLine },
    { label: "Scheduled", value: stats.scheduled, icon: Clock },
    { label: "Total views", value: stats.totalViews, icon: Eye },
    { label: "Total likes", value: stats.totalLikes, icon: Heart },
    { label: "Comments", value: stats.totalComments, icon: MessageSquare },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {stats.totalPoems} poems in the library.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/poems/new">
            <Plus className="size-4" /> New poem
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="flex items-center gap-3 py-5">
              <span className="bg-muted text-muted-foreground grid size-10 place-items-center rounded-lg">
                <card.icon className="size-5" />
              </span>
              <div>
                <p className="text-2xl font-semibold">
                  {card.value.toLocaleString()}
                </p>
                <p className="text-muted-foreground text-xs">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section>
        <h2 className="font-serif mb-4 text-lg font-semibold">
          Recently updated
        </h2>
        {recent.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No poems yet —{" "}
            <Link href="/admin/poems/new" className="text-primary hover:underline">
              write your first one
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {recent.slice(0, 6).map((poem) => (
              <li
                key={poem.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/poems/${poem.id}`}
                    className="truncate font-medium hover:text-primary"
                  >
                    {poem.title}
                  </Link>
                  <p className="text-muted-foreground text-xs">
                    {poem.status} · updated {formatDate(poem.updatedAt)}
                  </p>
                </div>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {poem.views} views
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
