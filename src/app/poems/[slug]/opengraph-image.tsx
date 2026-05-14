import { ImageResponse } from "next/og";
import { getPoemBySlug } from "@/lib/data/poems";
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
  const firstLines =
    poem?.content.split("\n").slice(0, 3).join("  ·  ").slice(0, 120) ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #1f2433 0%, #111827 100%)",
          padding: "80px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            color: "#e74c3c",
            fontSize: 28,
            letterSpacing: 8,
            textTransform: "uppercase",
          }}
        >
          {env.SITE_NAME}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ color: "#ffffff", fontSize: 68, lineHeight: 1.15 }}>
            {title}
          </div>
          {firstLines ? (
            <div style={{ color: "#cbd5e1", fontSize: 30 }}>{firstLines}</div>
          ) : null}
        </div>
        <div style={{ color: "#94a3b8", fontSize: 24 }}>
          Every verse, a priceless gift.
        </div>
      </div>
    ),
    { ...size },
  );
}
