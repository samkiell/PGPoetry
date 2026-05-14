import "server-only";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "pgp_vid";
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Returns a stable per-browser id used to de-duplicate likes from anonymous
 * visitors. Creates the cookie on first call (only possible inside a Server
 * Action or Route Handler, where the cookie store is writable).
 */
export async function getOrCreateVisitorId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE)?.value;
  if (existing) return existing;

  const id = randomUUID();
  store.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR,
    path: "/",
  });
  return id;
}

/** Read-only variant — returns the existing id or null, never writes. */
export async function peekVisitorId(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE)?.value ?? null;
}
