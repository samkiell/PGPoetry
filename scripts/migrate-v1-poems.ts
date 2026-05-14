/**
 * One-time migration: bring v1 poems into the v2 schema.
 *
 * v1 poems were always public and had no `status`, `publishedAt`, or
 * `coverImage` field. v2 hides anything that isn't `status: "published"`, so
 * without this they'd silently disappear from the site.
 *
 * For each poem missing a `status`, this sets:
 *   - status      -> "published"
 *   - publishedAt -> existing publishedAt, else createdAt, else now
 *   - coverImage  -> existing coverImage, else legacy thumbnail/featuredImage
 *
 * Idempotent: poems that already have a `status` are left untouched. Safe to
 * run more than once.
 *
 *   npm run migrate
 */
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import { Poem } from "../src/models/Poem";

// .env.local is loaded by tsx's --env-file flag (see the "migrate" npm script).

async function migrate() {
  await connectDB();

  // Talk to the raw collection so legacy fields (thumbnail, featuredImage)
  // that aren't in the v2 schema are still visible to the pipeline.
  const collection = Poem.collection;

  const pending = await collection.countDocuments({
    status: { $exists: false },
  });

  if (pending === 0) {
    console.log("Nothing to migrate — every poem already has a status.");
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${pending} v1 poem(s) to migrate…`);

  const result = await collection.updateMany({ status: { $exists: false } }, [
    {
      $set: {
        status: "published",
        publishedAt: {
          $ifNull: ["$publishedAt", { $ifNull: ["$createdAt", "$$NOW"] }],
        },
        scheduledFor: { $ifNull: ["$scheduledFor", null] },
        collectionId: { $ifNull: ["$collectionId", null] },
        coverImage: {
          $ifNull: [
            "$coverImage",
            { $ifNull: ["$thumbnail", { $ifNull: ["$featuredImage", ""] }] },
          ],
        },
        likes: { $ifNull: ["$likes", 0] },
        views: { $ifNull: ["$views", 0] },
      },
    },
  ]);

  console.log(`Migrated ${result.modifiedCount} poem(s) to "published".`);

  const published = await collection.countDocuments({ status: "published" });
  console.log(`Total published poems now: ${published}`);

  await mongoose.disconnect();
  console.log("Done.");
}

migrate().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
