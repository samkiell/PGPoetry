import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { uploadImage, isCloudinaryEnabled } from "@/lib/cloudinary";
import { rateLimitByIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const limited = await rateLimitByIp("upload", 30, 60_000);
  if (!limited.success) {
    return NextResponse.json(
      { error: "Too many uploads — slow down a moment." },
      { status: 429 },
    );
  }

  if (!isCloudinaryEnabled) {
    return NextResponse.json(
      { error: "Image uploads aren't configured. Add your Cloudinary keys." },
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPG, PNG, WEBP, and GIF images are allowed." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image is too large — 5 MB maximum." },
      { status: 400 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadImage(buffer, file.name || "upload");
    return NextResponse.json(result);
  } catch (err) {
    console.error("upload", err);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
