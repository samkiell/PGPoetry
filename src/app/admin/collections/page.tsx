import type { Metadata } from "next";
import { CollectionsManager } from "@/components/admin/collections-manager";
import { getCollections } from "@/lib/data/collections";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Collections" };

export default async function AdminCollectionsPage() {
  const collections = await getCollections();
  return <CollectionsManager collections={collections} />;
}
