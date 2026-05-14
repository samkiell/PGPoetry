import "server-only";
import { headers } from "next/headers";

/**
 * Lightweight in-memory fixed-window rate limiter.
 *
 * Good enough for a single-instance deployment and to blunt obvious abuse.
 * For a multi-instance / serverless setup at scale, swap the Map for a shared
 * store (Upstash Redis, etc.) — the `rateLimit` signature stays the same.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, resetAt };
  }

  bucket.count += 1;
  const success = bucket.count <= limit;
  return {
    success,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}

/** Best-effort client IP from common proxy headers. */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

/** Convenience: rate-limit the current request by client IP + action name. */
export async function rateLimitByIp(
  action: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const ip = await getClientIp();
  return rateLimit(`${action}:${ip}`, limit, windowMs);
}

// Periodically evict stale buckets so the Map doesn't grow unbounded.
const SWEEP_INTERVAL = 10 * 60 * 1000;
const globalForSweep = globalThis as unknown as { _rlSweep?: boolean };
if (!globalForSweep._rlSweep) {
  globalForSweep._rlSweep = true;
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt < now) buckets.delete(key);
    }
  }, SWEEP_INTERVAL).unref?.();
}
