import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PoemEditor } from "@/components/admin/poem-editor";
import { getPoemForEdit } from "@/lib/data/admin";
import { getCollections } from "@/lib/data/collections";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit poem" };

export default async function EditPoemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [poem, collections] = await Promise.all([
    getPoemForEdit(id),
    getCollections(),
  ]);

  if (!poem) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-2xl font-semibold">Edit poem</h1>
      <PoemEditor
        poem={poem}
        collections={collections.map((c) => ({ id: c.id, title: c.title }))}
      />
    </div>
  );
}
