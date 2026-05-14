import type { Metadata } from "next";
import { PoemEditor } from "@/components/admin/poem-editor";
import { getCollections } from "@/lib/data/collections";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New poem" };

export default async function NewPoemPage() {
  const collections = await getCollections();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-2xl font-semibold">New poem</h1>
      <PoemEditor
        collections={collections.map((c) => ({ id: c.id, title: c.title }))}
      />
    </div>
  );
}
