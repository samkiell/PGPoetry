/**
 * Centralised, validated environment access.
 * Importing from here (instead of reading process.env directly) gives us a
 * single, typed failure point if a required variable is missing.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const env = {
  MONGODB_URI: required("MONGODB_URI"),
  AUTH_SECRET: required("AUTH_SECRET"),

  GOOGLE_CLIENT_ID: optional("AUTH_GOOGLE_ID"),
  GOOGLE_CLIENT_SECRET: optional("AUTH_GOOGLE_SECRET"),

  CLOUDINARY_CLOUD_NAME: optional("CLOUDINARY_CLOUD_NAME"),
  CLOUDINARY_API_KEY: optional("CLOUDINARY_API_KEY"),
  CLOUDINARY_API_SECRET: optional("CLOUDINARY_API_SECRET"),

  ADMIN_EMAIL: optional("ADMIN_EMAIL"),

  SITE_URL: optional("NEXT_PUBLIC_SITE_URL", "http://localhost:3000"),
  SITE_NAME: optional("NEXT_PUBLIC_SITE_NAME", "PGpoetry"),
} as const;

export const isGoogleAuthEnabled = Boolean(
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET,
);

export const isCloudinaryEnabled = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
);
