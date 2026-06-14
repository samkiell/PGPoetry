/**
 * One-off maintenance: drop indexes left over from the pre-rename schema
 * (userId/poemId/ip/ua → user/poem/visitorId/author). Two of them were UNIQUE
 * on the now-absent fields, which collapsed every favorite/like to a single
 * {null,null} row and broke un-saving. Safe to re-run — missing indexes are
 * skipped.
 */
const m = require("mongoose");
const fs = require("fs");
const path = require("path");

const env = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const uri = (env.match(/MONGODB_URI=(.*)/) || [])[1]
  ?.trim()
  .replace(/^["']|["']$/g, "");

// An index is stale if any of its keys reference an old field name.
const STALE_FIELDS = ["userId", "poemId", "ip", "ua"];
const COLLECTIONS = ["favorites", "likes", "comments"];

function isStale(index) {
  return Object.keys(index.key).some((k) => STALE_FIELDS.includes(k));
}

(async () => {
  await m.connect(uri, { serverSelectionTimeoutMS: 8000 });
  let dropped = 0;
  for (const name of COLLECTIONS) {
    const coll = m.connection.collection(name);
    const indexes = await coll.indexes();
    for (const idx of indexes) {
      if (idx.name === "_id_") continue;
      if (isStale(idx)) {
        await coll.dropIndex(idx.name);
        console.log(`dropped ${name}.${idx.name} ${JSON.stringify(idx.key)}`);
        dropped++;
      }
    }
  }
  console.log(`\nDone. Dropped ${dropped} stale index(es).`);
  await m.disconnect();
})().catch((e) => {
  console.log("FATAL:", e.message);
  process.exit(1);
});
