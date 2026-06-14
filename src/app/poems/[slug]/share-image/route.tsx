import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";
import { getPoemBySlug } from "@/lib/data/poems";
import { htmlToPlainText, poemContentToHtml } from "@/lib/utils";

// Needs the Node runtime because the data layer uses Mongoose.
export const runtime = "nodejs";

const WIDTH = 1080;
const HEIGHT = 1350; // 4:5 portrait — friendly for IG/WhatsApp/X.

/**
 * Renders just the poem — title, verse, and the PG monogram — as a portrait
 * PNG for sharing. Deliberately omits the date and reading time.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const poem = await getPoemBySlug(slug);
  if (!poem) {
    return new Response("Not found", { status: 404 });
  }

  // poem.content is already signature-stripped by the data layer; split it into
  // display lines the same way the page does.
  const lines = htmlToPlainText(poemContentToHtml(poem.content))
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Embed the logo inline — ImageResponse can't fetch /public by path.
  const logoData = await readFile(
    path.join(process.cwd(), "public", "images", "pg_logo.png"),
  );
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  // Scale the verse down a touch when a poem runs long so it still fits.
  const verseSize = lines.length > 16 ? 30 : lines.length > 10 ? 36 : 42;

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
          background: "#0f1420",
          padding: "90px 80px",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Title */}
        <div
          style={{
            color: "#f8fafc",
            fontSize: 76,
            fontWeight: 500,
            lineHeight: 1.1,
            textAlign: "center",
            maxWidth: "100%",
          }}
        >
          {poem.title}
        </div>

        {/* Fleuron */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            margin: "56px 0",
          }}
        >
          <div style={{ width: 70, height: 1, background: "#334155" }} />
          {/* Diamond drawn as a rotated square — no font glyph needed, so it
              always renders in Satori (Unicode ornaments show as tofu). */}
          <div
            style={{
              width: 12,
              height: 12,
              background: "#e35d6a",
              transform: "rotate(45deg)",
            }}
          />
          <div style={{ width: 70, height: 1, background: "#334155" }} />
        </div>

        {/* Verse */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: Math.round(verseSize * 0.5),
            color: "#e2e8f0",
            fontSize: verseSize,
            lineHeight: 1.4,
            textAlign: "center",
          }}
        >
          {lines.map((line, i) => (
            <div key={i} style={{ display: "flex" }}>
              {line}
            </div>
          ))}
        </div>

        {/* Fleuron */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            margin: "56px 0 40px",
          }}
        >
          <div style={{ width: 70, height: 1, background: "#334155" }} />
          {/* Diamond drawn as a rotated square — no font glyph needed, so it
              always renders in Satori (Unicode ornaments show as tofu). */}
          <div
            style={{
              width: 12,
              height: 12,
              background: "#e35d6a",
              transform: "rotate(45deg)",
            }}
          />
          <div style={{ width: 70, height: 1, background: "#334155" }} />
        </div>

        {/* PG monogram signature */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={84} height={84} alt="PGpoetry" />
      </div>
    ),
    { width: WIDTH, height: HEIGHT },
  );
}
