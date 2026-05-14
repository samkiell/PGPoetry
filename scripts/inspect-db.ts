/**
 * Read-only diagnostic — reports what's actually in the poems collection.
 * Run via `npm run inspect-db` (loads .env.local through tsx's --env-file).
 */
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import { Poem } from "../src/models/Poem";

async function inspect() {
  await connectDB();
  const db = mongoose.connection;
  console.log("Connected DB name:", db.name);

  const collections = await db.db!.listCollections().toArray();
  console.log(
    "Collections:",
    collections.map((c) => c.name).join(", ") || "(none)",
  );

  const total = await Poem.collection.countDocuments();
  console.log(`\npoems total: ${total}`);

  const byStatus = await Poem.collection
    .aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
    .toArray();
  console.log("by status:", JSON.stringify(byStatus));

  const sample = await Poem.collection.findOne({});
  console.log("\nsample doc keys:", sample ? Object.keys(sample).join(", ") : "(no docs)");
  if (sample) {
    console.log("sample title:", sample.title);
    console.log("sample status:", sample.status);
    console.log("sample slug:", sample.slug);
  }

  await mongoose.disconnect();
}

inspect().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
