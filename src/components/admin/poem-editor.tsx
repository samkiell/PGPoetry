"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { ImageUpload } from "@/components/admin/image-upload";
import { TagInput } from "@/components/admin/tag-input";
import { createPoem, updatePoem, type PoemInput } from "@/app/actions/admin";
import {
  htmlToPlainText,
  poemContentToHtml,
  formatReadingTime,
  wordCount,
} from "@/lib/utils";
import type { PoemEditData } from "@/lib/data/admin";
import type { PoemStatus } from "@/models/Poem";

const NO_COLLECTION = "__none__";

/** Formats an ISO string for a `datetime-local` input (local time, no seconds). */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

export function PoemEditor({
  poem,
  collections,
}: {
  poem?: PoemEditData;
  collections: { id: string; title: string }[];
}) {
  const router = useRouter();
  const isEdit = Boolean(poem);

  const [title, setTitle] = React.useState(poem?.title ?? "");
  const [content, setContent] = React.useState(poem?.content ?? "");
  const [tags, setTags] = React.useState<string[]>(poem?.tags ?? []);
  const [featured, setFeatured] = React.useState(poem?.featured ?? false);
  const [status, setStatus] = React.useState<PoemStatus>(
    poem?.status ?? "draft",
  );
  const [coverImage, setCoverImage] = React.useState(poem?.coverImage ?? "");
  const [collectionId, setCollectionId] = React.useState(
    poem?.collectionId ?? NO_COLLECTION,
  );
  const [scheduledFor, setScheduledFor] = React.useState(
    toLocalInput(poem?.scheduledFor ?? null),
  );
  const [preview, setPreview] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const plain = htmlToPlainText(content);
  const words = wordCount(plain);

  function save() {
    if (!title.trim()) {
      toast.error("Give the poem a title.");
      return;
    }
    if (!plain.trim()) {
      toast.error("The poem can't be empty.");
      return;
    }

    const input: PoemInput = {
      title: title.trim(),
      content,
      tags,
      featured,
      status,
      coverImage,
      collectionId: collectionId === NO_COLLECTION ? null : collectionId,
      scheduledFor:
        status === "scheduled" && scheduledFor
          ? new Date(scheduledFor).toISOString()
          : null,
    };

    startTransition(async () => {
      const res =
        isEdit && poem
          ? await updatePoem(poem.id, input)
          : await createPoem(input);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(isEdit ? "Poem updated" : "Poem created");
      router.push("/admin/poems");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      {/* Main column */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled poem"
            className="font-serif text-lg"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Poem</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setPreview((p) => !p)}
          >
            {preview ? (
              <>
                <Pencil className="size-4" /> Edit
              </>
            ) : (
              <>
                <Eye className="size-4" /> Preview
              </>
            )}
          </Button>
        </div>

        {preview ? (
          <div
            className="poem-content font-serif min-h-[340px] rounded-md border px-4 py-3 text-lg leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: poemContentToHtml(content) || "<p>Nothing to preview yet.</p>",
            }}
          />
        ) : (
          <RichTextEditor value={content} onChange={setContent} />
        )}

        <p className="text-muted-foreground text-xs">
          {words} {words === 1 ? "word" : "words"} · {formatReadingTime(content)}
        </p>
      </div>

      {/* Sidebar */}
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Publishing</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as PoemStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {status === "scheduled" ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="scheduledFor">Publish at</Label>
                <Input
                  id="scheduledFor"
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                />
              </div>
            ) : null}

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="accent-primary size-4"
              />
              Feature on the home page
            </label>

            <Button onClick={save} disabled={pending} className="w-full">
              <Save className="size-4" />
              {pending
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Create poem"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cover image</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload value={coverImage} onChange={setCoverImage} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organise</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Collection</Label>
              <Select value={collectionId} onValueChange={setCollectionId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No collection" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_COLLECTION}>No collection</SelectItem>
                  {collections.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Tags</Label>
              <TagInput value={tags} onChange={setTags} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
