import "server-only";
import { connectDB } from "@/lib/db";
import { Poem } from "@/models/Poem";
import { User } from "@/models/User";
import { sendBroadcast } from "@/lib/email/send";
import { NewPoem } from "@/lib/email/templates/new-poem";
import { excerpt, htmlToPlainText } from "@/lib/utils";
import { env } from "@/lib/env";

/** Resend accepts up to 50 recipients per send; keep a margin. */
const BATCH_SIZE = 45;
/** How long the glimpse should be, in words — just a teaser, not the poem. */
const GLIMPSE_WORDS = 18;

/**
 * Emails every reader that a poem has been published — once. Uses an atomic
 * findOneAndUpdate on `broadcastedAt` as a claim, so concurrent publish paths
 * (manual save + scheduled sweep) can't double-send. Best-effort: failures are
 * logged, never thrown, so they can't break publishing.
 *
 * @param origin Public origin (scheme://host) for the "read in full" link.
 *   Pass the live request origin from the action; falls back to env.SITE_URL
 *   for contexts without a request (e.g. background/scheduled publishing).
 */
export async function broadcastNewPoem(
  poemId: string,
  origin?: string,
): Promise<void> {
  try {
    await connectDB();

    // Atomically claim the broadcast: only the first caller to flip
    // broadcastedAt from null gets the document back.
    const poem = await Poem.findOneAndUpdate(
      { _id: poemId, status: "published", broadcastedAt: null },
      { $set: { broadcastedAt: new Date() } },
      { new: true },
    ).lean();

    if (!poem) return; // not published, already broadcast, or gone

    const recipients = await User.find({ email: { $exists: true, $ne: "" } })
      .select("email")
      .lean();
    const emails = recipients
      .map((u) => u.email)
      .filter((e): e is string => Boolean(e));

    if (emails.length === 0) return;

    const plain = htmlToPlainText(poem.content);
    const { text: glimpse } = excerpt(plain, GLIMPSE_WORDS);
    const baseUrl = (origin ?? env.SITE_URL).replace(/\/+$/, "");
    const poemUrl = `${baseUrl}/poems/${poem.slug}`;

    const react = NewPoem({
      title: poem.title,
      glimpse,
      poemUrl,
      coverImage: poem.coverImage || undefined,
    });

    // BCC in batches so readers never see each other's addresses.
    let sent = 0;
    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE);
      const result = await sendBroadcast({
        bcc: batch,
        subject: `New poem: ${poem.title}`,
        react,
        devPreview: `new-poem broadcast → ${batch.length} recipients`,
      });
      if (result.ok) sent += batch.length;
    }

    console.info(`[broadcast] "${poem.title}" emailed to ${sent} reader(s)`);
  } catch (err) {
    console.error("[broadcast] new-poem broadcast failed:", err);
  }
}
