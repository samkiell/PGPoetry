import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Words-per-minute used for the "X min read" badge on poems. */
const WPM = 200;

export function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WPM));
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Strips the trailing "©PGpoetry" signature so excerpts/counts stay clean. */
export function stripSignature(content: string): string {
  return content.replace(/\n*©\s*PGpoetry\s*✍\s*$/u, "").trimEnd();
}

export function excerpt(content: string, maxWords = 29): { text: string; truncated: boolean } {
  const clean = stripSignature(content);
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return { text: clean, truncated: false };
  return { text: words.slice(0, maxWords).join(" ") + "…", truncated: true };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function decodeHtmlEntities(html: string): string {
  const textarea = typeof document !== 'undefined'
    ? document.createElement('textarea')
    : null;
  if (textarea) {
    textarea.innerHTML = html;
    return textarea.value;
  }
  return html
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/**
 * Poems may be stored either as Tiptap HTML (new editor) or as plain text
 * (poems carried over from v1). This normalises both to safe display HTML,
 * preserving the line breaks poetry depends on.
 */
export function poemContentToHtml(content: string): string {
  const trimmed = content.trim();
  const looksLikeHtml = /^<(p|h[1-6]|ul|ol|blockquote|div|br)\b/i.test(trimmed);
  if (looksLikeHtml) return decodeHtmlEntities(trimmed);

  return trimmed
    .split(/\n{2,}/)
    .map(
      (stanza) =>
        `<p>${escapeHtml(stanza).replace(/\n/g, "<br/>")}</p>`,
    )
    .join("");
}

/** Strips tags so HTML poems still produce clean text excerpts/counts. */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h[1-6]|div|blockquote|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}
