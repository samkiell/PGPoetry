import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { isGoogleAuthEnabled } from "@/lib/env";
import type { UserRole } from "@/models/User";

/**
 * Edge-safe Auth.js configuration.
 *
 * This module must NOT import Mongoose, the MongoDB adapter, or anything else
 * that depends on Node APIs at the top level — it is loaded by `middleware.ts`,
 * which runs on the edge runtime. DB access happens lazily inside `authorize`,
 * which only ever runs in the Node.js route handler.
 */

const googleProvider = isGoogleAuthEnabled
  ? [
      Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
        allowDangerousEmailAccountLinking: true,
      }),
    ]
  : [];

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  providers: [
    ...googleProvider,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Lazily pull in DB code so this module stays edge-compatible.
        const { verifyCredentials } = await import("@/lib/auth-credentials");
        const email =
          typeof credentials?.email === "string" ? credentials.email : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;
        return verifyCredentials(email, password);
      },
    }),
  ],
  callbacks: {
    /** Route protection — consulted by `middleware.ts` on every matched request. */
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const role = auth?.user?.role;
      const isLoggedIn = Boolean(auth?.user);

      if (pathname.startsWith("/admin")) {
        return role === "admin";
      }
      if (pathname.startsWith("/profile")) {
        return isLoggedIn;
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      // `user` is present on sign-in; reconcile role/username from the DB then
      // (and on an explicit session.update()). Reads stay edge-safe because
      // this branch never runs inside middleware.
      if (user || trigger === "update") {
        const id: string | undefined = user?.id ?? token.sub;
        if (id) {
          const { getUserAuthFields } = await import("@/lib/auth-credentials");
          const fields = await getUserAuthFields(id);
          token.id = id;
          token.role = fields?.role ?? "reader";
          token.username = fields?.username;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? "";
        session.user.role = (token.role as UserRole) ?? "reader";
        session.user.username = token.username as string | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
