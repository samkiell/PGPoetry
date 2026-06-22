import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";
import { getPoemBySlug } from "@/lib/data/poems";
import { htmlToPlainText, poemContentToHtml } from "@/lib/utils";

// Needs the Node runtime because the data layer uses Mongoose.
export const runtime = "nodejs";

const WIDTH = 1080;
const HEIGHT = 1350; // 4:5 portrait — friendly for IG/WhatsApp/X.

// Palettes mirror the site's light/dark tokens (Satori needs hex, not oklch).
const THEMES = {
  dark: {
    bg: "#181c24",
    fg: "#e8eaee",
    muted: "#cdd2db",
    rule: "#3a4150",
    accent: "#e35d6a",
    poemText: "#e8eaee",
  },
  light: {
    bg: "#ffffff",
    fg: "#111827",
    muted: "#4b5563",
    rule: "#e5e7eb",
    accent: "#e74c3c",
    poemText: "#1f2937",
  },
} as const;

// Strip emoji / pictographs — Satori has no emoji font, so they'd render as
// tofu. The image is a typographic piece; emoji don't belong in it anyway.
function stripEmoji(text: string): string {
  return text
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

// Parses normalized HTML into stanzas and lines, stripping extra tags and spaces
function parseHtmlToStanzas(html: string): string[][] {
  const stanzas: string[][] = [];
  const blockRegex = /<(p|blockquote|h[1-6]|div)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  let hasBlocks = false;

  while ((match = blockRegex.exec(html)) !== null) {
    hasBlocks = true;
    const blockContent = match[2].trim();
    if (!blockContent) continue;

    const lines = blockContent
      .split(/<br\s*\/?>/gi)
      .map((line) => htmlToPlainText(line).trim())
      .filter((line) => line.length > 0);

    if (lines.length > 0) {
      stanzas.push(lines);
    }
  }

  if (!hasBlocks) {
    const plainText = htmlToPlainText(html);
    const paragraphs = plainText.split(/\n{2,}/);
    for (const para of paragraphs) {
      const lines = para.split(/\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        stanzas.push(lines);
      }
    }
  }

  return stanzas;
}

// Google Fonts hands back a .ttf (Satori-compatible) when asked without a
// modern UA. Cached across requests via the fetch cache.
async function loadFont(family: string, weight: number): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&display=swap`,
    { headers: { "User-Agent": "Mozilla/4.0" } },
  ).then((r) => r.text());
  const url = css.match(/https:\/\/[^)]+\.ttf/)?.[0];
  if (!url) throw new Error(`No TTF for ${family}`);
  return fetch(url).then((r) => r.arrayBuffer());
}

/**
 * Renders the poem as a portrait share card:
 * - A PG-monogram brand lockup.
 * - The poem title (centered).
 * - The full/partial poem rendered in stanzas (centered).
 * - Tagline, border, and tags footer.
 * Dynamically adjusts font size based on lines to fit perfectly.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const poem = await getPoemBySlug(slug);
  if (!poem) return new Response("Not found", { status: 404 });

  const themeParam = new URL(req.url).searchParams.get("theme");
  const t = themeParam === "light" ? THEMES.light : THEMES.dark;

  const title = stripEmoji(poem.title);
  
  // Parse full poem into stanzas and lines
  const normalizedHtml = poemContentToHtml(poem.content);
  const stanzas = parseHtmlToStanzas(normalizedHtml);
  const totalLines = stanzas.reduce((acc, s) => acc + s.length, 0);
  const totalStanzas = stanzas.length;

  // Determine title font size dynamically
  let titleFontSize = 64;
  if (title.length > 40) {
    titleFontSize = 44;
  } else if (title.length > 25) {
    titleFontSize = 52;
  }

  // Find best fitting sizes for stanzas
  const maxContentHeight = 780; // Safe vertical height for the poem text body
  const fontSizes = [34, 28, 24, 20, 18];
  let bestFontSize = 18;
  let bestLineHeight = 1.35;
  let bestStanzaGap = 12;
  let fitsEntirely = false;

  for (const fs of fontSizes) {
    const lh = fs > 28 ? 1.5 : (fs > 20 ? 1.45 : 1.4);
    const sg = fs > 28 ? 28 : (fs > 20 ? 20 : 16);
    const totalHeight = totalLines * fs * lh + (totalStanzas - 1) * sg;
    if (totalHeight <= maxContentHeight) {
      bestFontSize = fs;
      bestLineHeight = lh;
      bestStanzaGap = sg;
      fitsEntirely = true;
      break;
    }
  }

  let renderedStanzas: string[][] = [];
  let isTruncated = false;

  if (fitsEntirely) {
    renderedStanzas = stanzas;
  } else {
    // Truncate at smallest font size (18px)
    bestFontSize = 18;
    bestLineHeight = 1.35;
    bestStanzaGap = 12;
    
    let currentHeight = 0;
    for (let i = 0; i < stanzas.length; i++) {
      const stanza = stanzas[i];
      const stanzaHeight = stanza.length * bestFontSize * bestLineHeight + (i > 0 ? bestStanzaGap : 0);
      if (currentHeight + stanzaHeight + 40 > maxContentHeight) {
        isTruncated = true;
        break;
      }
      renderedStanzas.push(stanza);
      currentHeight += stanzaHeight;
    }
    if (renderedStanzas.length === 0 && stanzas.length > 0) {
      renderedStanzas.push(stanzas[0]);
    }
  }

  const [logoData, playfair, inter] = await Promise.all([
    readFile(path.join(process.cwd(), "public", "images", "pg_logo.png")),
    loadFont("Playfair+Display", 600),
    loadFont("Inter", 400),
  ]);
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: t.bg,
          backgroundImage: `linear-gradient(150deg, ${t.bg} 0%, ${t.rule}22 100%)`,
          padding: "80px 80px 60px 80px",
        }}
      >
        {/* Brand lockup */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={72} height={72} alt="" />
          <span
            style={{
              color: t.accent,
              fontSize: 28,
              letterSpacing: 10,
              textTransform: "uppercase",
              fontFamily: "Inter",
              fontWeight: 700,
            }}
          >
            poetry
          </span>
        </div>

        {/* Title + Poem Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flexGrow: 1,
            gap: 40,
            width: "100%",
            margin: "40px 0",
          }}
        >
          {/* Title */}
          <div
            style={{
              color: t.fg,
              fontSize: titleFontSize,
              fontFamily: "Playfair Display",
              lineHeight: 1.1,
              textAlign: "center",
              fontWeight: 600,
              maxWidth: "95%",
            }}
          >
            {title}
          </div>

          {/* Poem body stanzas */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: bestStanzaGap,
              width: "100%",
            }}
          >
            {renderedStanzas.map((stanza, sIdx) => (
              <div
                key={sIdx}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {stanza.map((line, lIdx) => (
                  <span
                    key={lIdx}
                    style={{
                      color: t.poemText,
                      fontSize: bestFontSize,
                      fontFamily: "Inter",
                      lineHeight: bestLineHeight,
                      textAlign: "center",
                    }}
                  >
                    {line}
                  </span>
                ))}
              </div>
            ))}

            {isTruncated && (
              <span
                style={{
                  color: t.accent,
                  fontSize: Math.max(16, bestFontSize - 2),
                  fontFamily: "Inter",
                  fontStyle: "italic",
                  marginTop: 16,
                  textAlign: "center",
                }}
              >
                ... (continued on PGpoetry)
              </span>
            )}
          </div>
        </div>

        {/* Footer: tagline + tags */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "Inter",
            fontSize: 26,
            borderTop: `1px solid ${t.rule}`,
            paddingTop: 32,
            width: "100%",
          }}
        >
          <span style={{ color: t.muted }}>Every verse, a priceless gift.</span>
          {poem.tags.length ? (
            <span style={{ color: t.accent }}>
              {poem.tags.slice(0, 3).map((tag) => `#${tag}`).join("  ")}
            </span>
          ) : null}
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: "Playfair Display", data: playfair, weight: 600, style: "normal" },
        { name: "Inter", data: inter, weight: 400, style: "normal" },
      ],
    },
  );
}
