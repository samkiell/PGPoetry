"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { Poem } from "@/models/Poem";
import { Collection } from "@/models/Collection";
import { Comment } from "@/models/Comment";
import { Like } from "@/models/Like";
import { Favorite } from "@/models/Favorite";

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

async function ensureAdmin(): Promise<Result> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { ok: false, error: "Admin access required." };
  }
  return { ok: true };
}

const objectId = z.string().regex(/^[a-f0-9]{24}$/i);

/* ------------------------------- Poems ----------------------------------- */

const poemSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required.").max(200),
    content: z.string().trim().min(1, "The poem can't be empty."),
    tags: z.array(z.string().trim().toLowerCase()).max(12).default([]),
    featured: z.boolean().default(false),
    status: z.enum(["draft", "scheduled", "published"]),
    coverImage: z.string().trim().default(""),
    collectionId: objectId.nullable().default(null),
    scheduledFor: z.string().datetime().nullable().default(null),
  })
  .refine(
    (d) => d.status !== "scheduled" || Boolean(d.scheduledFor),
    { message: "Pick a date and time to schedule for.", path: ["scheduledFor"] },
  );

export type PoemInput = z.input<typeof poemSchema>;

export async function createPoem(
  input: PoemInput,
): Promise<Result<{ id: string }>> {
  const guard = await ensureAdmin();
  if (!guard.ok) return guard;

  const parsed = poemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid poem." };
  }
  const data = parsed.data;

  await connectDB();
  try {
    const poem = new Poem({
      title: data.title,
      content: data.content,
      tags: data.tags,
      featured: data.featured,
      status: data.status,
      coverImage: data.coverImage,
      collectionId: data.collectionId,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
    });
    await poem.save(); // pre hooks set slug + publishedAt

    revalidatePath("/admin/poems");
    revalidatePath("/poems");
    return { ok: true, id: String(poem._id) };
  } catch (err) {
    if (isDuplicateKey(err)) {
      return { ok: false, error: "A poem with this title already exists." };
    }
    console.error("createPoem", err);
    return { ok: false, error: "Couldn't save the poem." };
  }
}

export async function updatePoem(
  id: string,
  input: PoemInput,
): Promise<Result<{ id: string }>> {
  const guard = await ensureAdmin();
  if (!guard.ok) return guard;
  if (!objectId.safeParse(id).success) {
    return { ok: false, error: "Invalid poem id." };
  }

  const parsed = poemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid poem." };
  }
  const data = parsed.data;

  await connectDB();
  try {
    const poem = await Poem.findById(id);
    if (!poem) return { ok: false, error: "Poem not found." };

    poem.title = data.title;
    poem.content = data.content;
    poem.tags = data.tags;
    poem.featured = data.featured;
    poem.status = data.status;
    poem.coverImage = data.coverImage;
    poem.set("collectionId", data.collectionId ?? null);
    poem.scheduledFor = data.scheduledFor ? new Date(data.scheduledFor) : null;
    // If it's pulled back out of "published", clear the timestamp.
    if (data.status !== "published") poem.publishedAt = null;
    await poem.save();

    revalidatePath("/admin/poems");
    revalidatePath(`/poems/${poem.slug}`);
    revalidatePath("/poems");
    return { ok: true, id: String(poem._id) };
  } catch (err) {
    if (isDuplicateKey(err)) {
      return { ok: false, error: "A poem with this title already exists." };
    }
    console.error("updatePoem", err);
    return { ok: false, error: "Couldn't update the poem." };
  }
}

export async function deletePoem(id: string): Promise<Result> {
  const guard = await ensureAdmin();
  if (!guard.ok) return guard;
  if (!objectId.safeParse(id).success) {
    return { ok: false, error: "Invalid poem id." };
  }

  await connectDB();
  const poem = await Poem.findByIdAndDelete(id);
  if (!poem) return { ok: false, error: "Poem not found." };

  // Clean up everything that pointed at this poem.
  await Promise.all([
    Comment.deleteMany({ poem: id }),
    Like.deleteMany({ poem: id }),
    Favorite.deleteMany({ poem: id }),
  ]);

  revalidatePath("/admin/poems");
  revalidatePath("/poems");
  return { ok: true };
}

/* ---------------------------- Collections -------------------------------- */

const collectionSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(160),
  description: z.string().trim().max(600).default(""),
  coverImage: z.string().trim().default(""),
  featured: z.boolean().default(false),
});

export type CollectionInput = z.input<typeof collectionSchema>;

export async function createCollection(
  input: CollectionInput,
): Promise<Result<{ id: string }>> {
  const guard = await ensureAdmin();
  if (!guard.ok) return guard;

  const parsed = collectionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid collection.",
    };
  }

  await connectDB();
  try {
    const collection = new Collection(parsed.data);
    await collection.save();
    revalidatePath("/admin/collections");
    revalidatePath("/collections");
    return { ok: true, id: String(collection._id) };
  } catch (err) {
    if (isDuplicateKey(err)) {
      return { ok: false, error: "A collection with this title already exists." };
    }
    console.error("createCollection", err);
    return { ok: false, error: "Couldn't create the collection." };
  }
}

export async function updateCollection(
  id: string,
  input: CollectionInput,
): Promise<Result> {
  const guard = await ensureAdmin();
  if (!guard.ok) return guard;
  if (!objectId.safeParse(id).success) {
    return { ok: false, error: "Invalid collection id." };
  }

  const parsed = collectionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid collection.",
    };
  }

  await connectDB();
  try {
    const collection = await Collection.findById(id);
    if (!collection) return { ok: false, error: "Collection not found." };
    collection.title = parsed.data.title;
    collection.description = parsed.data.description;
    collection.coverImage = parsed.data.coverImage;
    collection.featured = parsed.data.featured;
    await collection.save();

    revalidatePath("/admin/collections");
    revalidatePath(`/collections/${collection.slug}`);
    revalidatePath("/collections");
    return { ok: true };
  } catch (err) {
    if (isDuplicateKey(err)) {
      return { ok: false, error: "A collection with this title already exists." };
    }
    console.error("updateCollection", err);
    return { ok: false, error: "Couldn't update the collection." };
  }
}

export async function deleteCollection(id: string): Promise<Result> {
  const guard = await ensureAdmin();
  if (!guard.ok) return guard;
  if (!objectId.safeParse(id).success) {
    return { ok: false, error: "Invalid collection id." };
  }

  await connectDB();
  const collection = await Collection.findByIdAndDelete(id);
  if (!collection) return { ok: false, error: "Collection not found." };

  // Poems survive — they just lose their collection link.
  await Poem.updateMany({ collectionId: id }, { collectionId: null });

  revalidatePath("/admin/collections");
  revalidatePath("/collections");
  return { ok: true };
}

function isDuplicateKey(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === 11000
  );
}
