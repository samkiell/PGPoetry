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
 * Renders just the poem — title, verse, and the PG monogram — as a portrait
 * PNG for sharing/downloading. Omits the date and reading time. Honours the
 * current theme via `?theme=light|dark` and uses the site's serif fonts.
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

  const lines = stripEmoji(htmlToPlainText(poemContentToHtml(poem.content)))
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const title = stripEmoji(poem.title);

  // Match the site exactly: Playfair Display for the title (font-serif),
  // Cormorant @400 for the verse (.poem-content / --font-cormorant-gould), and
  // Noto Sans Symbols 2 for the ❦ floral-heart ornament (the serif fonts don't
  // include that glyph, so it would render as tofu otherwise).
  const [logoData, playfair, cormorant, symbols] = await Promise.all([
    readFile(path.join(process.cwd(), "public", "images", "pg_logo.png")),
    loadFont("Playfair+Display", 600),
    loadFont("Cormorant", 400),
    loadFont("Noto+Sans+Symbols+2", 400),
  ]);
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  // Scale the verse down a touch when a poem runs long so it still fits.
  const verseSize = lines.length > 16 ? 34 : lines.length > 10 ? 40 : 46;

  const fleuron = (
    <div style={{ display: "flex", alignItems: "center", gap: 24, margin: "56px 0" }}>
      <div style={{ width: 70, height: 1, background: t.rule }} />
      <div
        style={{
          color: t.accent,
          fontSize: 30,
          fontFamily: "Noto Sans Symbols 2",
          lineHeight: 1,
        }}
      >
        ❦
      </div>
      <div style={{ width: 70, height: 1, background: t.rule }} />
    </div>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: t.bg,
          padding: "90px 80px",
        }}
      >
        <div
          style={{
            color: t.fg,
            fontSize: 84,
            fontFamily: "Playfair Display",
            lineHeight: 1.1,
            textAlign: "center",
            maxWidth: "100%",
          }}
        >
          {title}
        </div>

        {fleuron}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: Math.round(verseSize * 0.45),
            color: t.muted,
            fontSize: verseSize,
            fontFamily: "Cormorant",
            lineHeight: 1.35,
            textAlign: "center",
          }}
        >
          {lines.map((line, i) => (
            <div key={i} style={{ display: "flex" }}>
              {line}
            </div>
          ))}
        </div>

        {fleuron}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={84} height={84} alt="PGpoetry" />
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: "Playfair Display", data: playfair, weight: 600, style: "normal" },
        { name: "Cormorant", data: cormorant, weight: 400, style: "normal" },
        { name: "Noto Sans Symbols 2", data: symbols, weight: 400, style: "normal" },
      ],
    },
  );
}
