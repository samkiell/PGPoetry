import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongoClient";
import { authConfig } from "@/auth.config";

/**
 * The full Auth.js instance (Node runtime only).
 *
 * The MongoDB adapter persists OAuth users/accounts. Sessions use the JWT
 * strategy because the Credentials provider requires it — the adapter is still
 * consulted for account linking and OAuth user records.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: MongoDBAdapter(clientPromise),
  trustHost: true,
});
