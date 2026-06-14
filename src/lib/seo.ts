import { env } from "@/lib/env";
import { htmlToPlainText } from "@/lib/utils";

/**
 * Centralised SEO config + helpers. Keeps titles, descriptions, and structured
 * data consistent across poems, collections, tags, and the homepage.
 */

export const SITE_URL = env.SITE_URL.replace(/\/+$/, "");
export const SITE_NAME = env.SITE_NAME;
/** Single-author site — the poet behind PGpoetry. */
export const AUTHOR_NAME = "PGpoetry";
export const SITE_LOGO = `${SITE_URL}/images/pg_logo.png`;
export const DEFAULT_OG = `${SITE_URL}/opengraph-image`;

/** Absolute URL for a path, safe for canonical/OG/JSON-LD. */
export function absolute(path: string): string {
  return path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

/**
 * Builds a clean meta description from poem content: the opening lines, capped
 * at `max` chars without cutting a word mid-way, signature/HTML already stripped
 * upstream. Falls back to a sensible default for empty content.
 */
export function metaDescription(content: string, max = 155): string {
  const plain = htmlToPlainText(content)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (!plain) return `An original poem on ${SITE_NAME}.`;
  if (plain.length <= max) return plain;

  // Trim to the last full word before the limit, then add an ellipsis.
  const cut = plain.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** Title-cases a tag for display: "new month" → "New Month". */
export function titleizeTag(tag: string): string {
  return tag
    .split(/[\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
