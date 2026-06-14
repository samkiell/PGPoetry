import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";
import { getPoemBySlug } from "@/lib/data/poems";
import { htmlToPlainText } from "@/lib/utils";
import { env } from "@/lib/env";

// Needs the Node runtime because the data layer uses Mongoose.
export const runtime = "nodejs";

export const alt = "A poem on PGpoetry";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const poem = await getPoemBySlug(slug);
  const title = poem?.title ?? env.SITE_NAME;

  // Embed the transparent PG monogram inline — Satori can't fetch /public.
  const logoData = await readFile(
    path.join(process.cwd(), "public", "images", "pg_logo.png"),
  );
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  // Clean opening lines (entities decoded, signature already stripped upstream).
  const lines = poem
    ? htmlToPlainText(poem.content)
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 3)
    : [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #1f2433 0%, #0f1420 100%)",
          padding: "72px 80px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={64} height={64} alt="" />
          <span
            style={{
              color: "#e35d6a",
              fontSize: 26,
              letterSpacing: 8,
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            poetry
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              color: "#f8fafc",
              fontSize: 72,
              lineHeight: 1.1,
              fontWeight: 600,
            }}
          >
            {title}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {lines.map((line, i) => (
              <div key={i} style={{ color: "#cbd5e1", fontSize: 30 }}>
                {line}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#94a3b8",
            fontSize: 24,
          }}
        >
          <span>Every verse, a priceless gift.</span>
          {poem?.tags?.length ? (
            <span style={{ color: "#e35d6a" }}>
              {poem.tags.slice(0, 3).map((t) => `#${t}`).join("  ")}
            </span>
          ) : null}
        </div>
      </div>
    ),
    { ...size },
  );
}
