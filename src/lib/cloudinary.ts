import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { env, isCloudinaryEnabled } from "@/lib/env";

if (isCloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export interface UploadResult {
  url: string;
  publicId: string;
}

/** Uploads an image buffer to the `pgpoetry` folder and returns its secure URL. */
export async function uploadImage(
  buffer: Buffer,
  filename: string,
): Promise<UploadResult> {
  if (!isCloudinaryEnabled) {
    throw new Error("Cloudinary is not configured.");
  }

  return new Promise<UploadResult>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "pgpoetry",
        public_id: `${Date.now()}-${filename.replace(/\.[^.]+$/, "")}`,
        resource_type: "image",
        transformation: [{ width: 1600, crop: "limit", quality: "auto" }],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Upload failed"));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}

export { isCloudinaryEnabled };
