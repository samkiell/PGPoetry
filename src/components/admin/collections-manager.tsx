"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/admin/image-upload";
import { EmptyState } from "@/components/empty-state";
import {
  createCollection,
  updateCollection,
  deleteCollection,
} from "@/app/actions/admin";
import type { CollectionItem } from "@/types/content";

type Draft = {
  id?: string;
  title: string;
  description: string;
  coverImage: string;
  featured: boolean;
};

const EMPTY: Draft = {
  title: "",
  description: "",
  coverImage: "",
  featured: false,
};

export function CollectionsManager({
  collections,
}: {
  collections: CollectionItem[];
}) {
  const router = useRouter();
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [deleting, setDeleting] = React.useState<CollectionItem | null>(null);
  const [pending, startTransition] = React.useTransition();

  function save() {
    if (!draft) return;
    if (!draft.title.trim()) {
      toast.error("Give the collection a title.");
      return;
    }
    const payload = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      coverImage: draft.coverImage,
      featured: draft.featured,
    };
    startTransition(async () => {
      const res = draft.id
        ? await updateCollection(draft.id, payload)
        : await createCollection(payload);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(draft.id ? "Collection updated" : "Collection created");
      setDraft(null);
      router.refresh();
    });
  }

  function remove() {
    if (!deleting) return;
    startTransition(async () => {
      const res = await deleteCollection(deleting.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Collection deleted");
      setDeleting(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold">Collections</h1>
        <Button onClick={() => setDraft({ ...EMPTY })}>
          <Plus className="size-4" /> New collection
        </Button>
      </div>

      {collections.length === 0 ? (
        <EmptyState
          title="No collections yet"
          description="Group related poems into a series readers can browse together."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-left text-xs uppercase">
              <tr>
                <th className="px-4 py-2.5 font-medium">Title</th>
                <th className="hidden px-4 py-2.5 font-medium sm:table-cell">
                  Poems
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {collections.map((collection) => (
                <tr key={collection.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{collection.title}</span>
                      {collection.featured ? (
                        <Badge variant="secondary" className="text-[10px]">
                          Featured
                        </Badge>
                      ) : null}
                    </div>
                    {collection.description ? (
                      <p className="text-muted-foreground line-clamp-1 text-xs">
                        {collection.description}
                      </p>
                    ) : null}
                  </td>
                  <td className="text-muted-foreground hidden px-4 py-3 sm:table-cell">
                    {collection.poemCount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit collection"
                        onClick={() =>
                          setDraft({
                            id: collection.id,
                            title: collection.title,
                            description: collection.description,
                            coverImage: collection.coverImage,
                            featured: collection.featured,
                          })
                        }
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete collection"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleting(collection)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / edit dialog */}
      <Dialog open={Boolean(draft)} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {draft?.id ? "Edit collection" : "New collection"}
            </DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="c-title">Title</Label>
                <Input
                  id="c-title"
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                  placeholder="Letters to the Sea"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="c-desc">Description</Label>
                <Textarea
                  id="c-desc"
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                  maxLength={600}
                  rows={3}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Cover image</Label>
                <ImageUpload
                  value={draft.coverImage}
                  onChange={(url) => setDraft({ ...draft, coverImage: url })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.featured}
                  onChange={(e) =>
                    setDraft({ ...draft, featured: e.target.checked })
                  }
                  className="accent-primary size-4"
                />
                Feature this collection
              </label>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDraft(null)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button onClick={save} disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this collection?</DialogTitle>
            <DialogDescription>
              “{deleting?.title}” will be removed. Its poems stay published —
              they just won&apos;t belong to a collection anymore.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleting(null)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={remove}
              disabled={pending}
            >
              {pending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
