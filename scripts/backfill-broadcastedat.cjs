/**
 * One-off: mark already-published poems as broadcast so a later edit doesn't
 * fire a "new poem" email for content that's been live for a while. These
 * poems predate the email feature (broadcastedAt is null) but aren't new, so
 * we stamp broadcastedAt = their publishedAt (or now) to suppress the resend.
 * Safe to re-run.
 */
const m = require("mongoose");
const fs = require("fs");
const path = require("path");

const env = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const uri = (env.match(/MONGODB_URI=(.*)/) || [])[1]
  ?.trim()
  .replace(/^["']|["']$/g, "");

(async () => {
  await m.connect(uri, { serverSelectionTimeoutMS: 8000 });
  const Poem = m.connection.collection("poems");

  const stamp = await Poem.updateMany(
    {
      status: "published",
      $or: [{ broadcastedAt: null }, { broadcastedAt: { $exists: false } }],
    },
    // Use publishedAt when present, else the current time, as the stamp.
    [{ $set: { broadcastedAt: { $ifNull: ["$publishedAt", "$$NOW"] } } }],
  );
  console.log(`stamped broadcastedAt on ${stamp.modifiedCount} published poem(s)`);

  const remaining = await Poem.countDocuments({
    status: "published",
    $or: [{ broadcastedAt: null }, { broadcastedAt: { $exists: false } }],
  });
  console.log(`published poems still without broadcastedAt: ${remaining}`);

  await m.disconnect();
})().catch((e) => {
  console.log("FATAL:", e.message);
  process.exit(1);
});
