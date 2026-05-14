import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

/**
 * Edge proxy (formerly "middleware") for route protection. Uses only the
 * edge-safe `authConfig` — no adapter, no Mongoose. The `authorized` callback
 * in `auth.config.ts` decides access for `/admin/*` and `/profile/*`.
 */
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  // Run on everything except static assets and Next internals.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.\\w+$).*)"],
};
