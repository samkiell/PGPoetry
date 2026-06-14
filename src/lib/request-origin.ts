import "server-only";
import { headers } from "next/headers";
import { env } from "@/lib/env";

/**
 * Builds the public origin (scheme://host) for the current request from proxy
 * headers, so links in emails point at wherever the app is actually served —
 * localhost in dev, the deployed domain in prod. Falls back to env.SITE_URL
 * when there's no request context (e.g. background/scheduled work).
 */
export async function getRequestOrigin(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (!host) return env.SITE_URL;
    const proto =
      h.get("x-forwarded-proto") ??
      (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  } catch {
    // headers() throws outside a request scope — use the configured fallback.
    return env.SITE_URL;
  }
}
