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
  dark: { bg: "#181c24", fg: "#e8eaee", muted: "#cdd2db", rule: "#3a4150", accent: "#e35d6a" },
  light: { bg: "#fdfdfb", fg: "#2b3242", muted: "#4a5160", rule: "#d9d9d2", accent: "#e74c3c" },
} as const;

// Strip emoji / pictographs — Satori has no emoji font, so they'd render as
// tofu. The image is a typographic piece; emoji don't belong in it anyway.
function stripEmoji(text: string): string {
  return text
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
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
 * Renders the poem as a portrait share card laid out like the OG meta image:
 * a PG-monogram lockup, the title, the opening lines (flowing, not centered),
 * and a tagline + tags footer. Top-aligned so long poems read gracefully.
 * Honours the theme via `?theme=light|dark` and uses the site's fonts.
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
  // Opening lines, joined into a flowing excerpt that wraps naturally. Capped
  // so even a very long poem never overflows the card.
  const excerpt = stripEmoji(htmlToPlainText(poemContentToHtml(poem.content)))
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 360);

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
          background: `linear-gradient(150deg, ${t.bg} 0%, ${t.rule}22 100%)`,
          padding: "84px 80px",
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

        {/* Title + opening lines */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <div
            style={{
              color: t.fg,
              fontSize: 80,
              fontFamily: "Playfair Display",
              lineHeight: 1.08,
            }}
          >
            {title}
          </div>
          <div
            style={{
              color: t.muted,
              fontSize: 38,
              fontFamily: "Inter",
              lineHeight: 1.5,
            }}
          >
            {excerpt}
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
