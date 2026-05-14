/**
 * Idempotent dev seed — adds a sample collection and a few poems so a fresh
 * database isn't empty. Safe to run repeatedly: it skips anything that already
 * exists (matched by slug) and never deletes.
 *
 *   npm run seed
 */
import { connectDB } from "../src/lib/db";
import { Poem } from "../src/models/Poem";
import { Collection } from "../src/models/Collection";

// .env.local is loaded by tsx's --env-file flag (see the "seed" npm script).

const SAMPLE_COLLECTION = {
  title: "Quiet Hours",
  description: "Poems for the slow parts of the day.",
};

const SAMPLE_POEMS = [
  {
    title: "Morning, Unhurried",
    content:
      "<p>The kettle hums a single note,<br/>steam writing softly on the glass.</p><p>I let the morning take its time —<br/>there is nowhere I need to be<br/>that the light has not arrived first.</p>",
    tags: ["morning", "stillness"],
    featured: true,
  },
  {
    title: "What the Tide Keeps",
    content:
      "<p>Everything the sea returns<br/>it returns changed:</p><p>the glass made soft,<br/>the wood made smooth,<br/>the letter, finally, unread.</p>",
    tags: ["sea", "letting-go"],
    featured: true,
  },
  {
    title: "Late Lamp",
    content:
      "<p>One light still on down the street —<br/>someone else is also awake,<br/>also keeping the dark a little company.</p>",
    tags: ["night", "stillness"],
    featured: false,
  },
];

async function seed() {
  await connectDB();

  let collection = await Collection.findOne({
    slug: "quiet-hours",
  });
  if (!collection) {
    collection = await Collection.create({
      ...SAMPLE_COLLECTION,
      featured: true,
    });
    console.log(`+ collection: ${collection.title}`);
  } else {
    console.log(`= collection exists: ${collection.title}`);
  }

  for (const sample of SAMPLE_POEMS) {
    const slug = sample.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const existing = await Poem.findOne({ slug });
    if (existing) {
      console.log(`= poem exists: ${sample.title}`);
      continue;
    }
    await Poem.create({
      ...sample,
      status: "published",
      publishedAt: new Date(),
      collectionId: collection._id,
    });
    console.log(`+ poem: ${sample.title}`);
  }

  console.log("Done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
