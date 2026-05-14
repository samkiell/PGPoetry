import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PoemCard } from "@/components/poem-card";
import { EmptyState } from "@/components/empty-state";
import { requireUser } from "@/lib/session";
import { getUserFavorites } from "@/lib/data/favorites";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your favorites" };

export default async function FavoritesPage() {
  const session = await requireUser("/profile/favorites");
  const favorites = await getUserFavorites(session.id);

  return (
    <div>
      <h1 className="font-serif mb-6 text-2xl font-semibold">
        Your favorites
      </h1>

      {favorites.length === 0 ? (
        <EmptyState
          title="No favorites yet"
          description="Tap “Save” on any poem to keep it here for later."
        >
          <Button asChild size="sm" className="mt-2">
            <Link href="/poems">Browse poems</Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((poem) => (
            <PoemCard key={poem.id} poem={poem} />
          ))}
        </div>
      )}
    </div>
  );
}
