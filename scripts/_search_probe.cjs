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
  const idx = await Poem.indexes();
  console.log("Indexes on poems:");
  for (const i of idx) console.log(" -", i.name, JSON.stringify(i.key));
  await m.disconnect();
})().catch((e) => {
  console.log("FATAL:", e.message);
  process.exit(1);
});
