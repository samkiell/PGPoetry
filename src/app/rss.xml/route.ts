import { getLatestPoems } from "@/lib/data/poems";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Escapes the five XML predefined entities for safe inclusion in the feed. */
function xml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const poems = await getLatestPoems(30);
  const site = env.SITE_URL;

  const items = poems
    .map((poem) => {
      const link = `${site}/poems/${poem.slug}`;
      const pubDate = poem.publishedAt
        ? new Date(poem.publishedAt).toUTCString()
        : new Date().toUTCString();
      return `    <item>
      <title>${xml(poem.title)}</title>
      <link>${xml(link)}</link>
      <guid isPermaLink="true">${xml(link)}</guid>
      <description>${xml(poem.excerpt)}</description>
      <pubDate>${pubDate}</pubDate>
${poem.tags.map((t) => `      <category>${xml(t)}</category>`).join("\n")}
    </item>`;
    })
    .join("\n");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xml(env.SITE_NAME)}</title>
    <link>${xml(site)}</link>
    <description>Every verse, a priceless gift. Latest poems from ${xml(env.SITE_NAME)}.</description>
    <language>en</language>
    <atom:link href="${xml(`${site}/rss.xml`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800, s-maxage=1800",
    },
  });
}
