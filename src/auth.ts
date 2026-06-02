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
  events: {
    async createUser({ user }) {
      try {
        const { connectDB } = await import("@/lib/db");
        const { User } = await import("@/models/User");
        const { roleForEmail } = await import("@/lib/auth-credentials");

        await connectDB();

        const dbUser = await User.findById(user.id);
        if (dbUser) {
          if (!dbUser.username) {
            let baseUsername = "";
            if (dbUser.email) {
              baseUsername = dbUser.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
            } else if (dbUser.name) {
              baseUsername = dbUser.name.toLowerCase().replace(/[^a-z0-9_]/g, "");
            }

            if (!baseUsername || baseUsername.length < 3) {
              baseUsername = "user";
            }
            if (baseUsername.length < 3) {
              baseUsername = (baseUsername + "usr").slice(0, 3);
            }

            let username = baseUsername;
            let counter = 1;
            while (true) {
              const exists = await User.findOne({ username }).lean();
              if (!exists) {
                break;
              }
              username = `${baseUsername}_${counter}`;
              counter++;
            }
            dbUser.username = username;
          }

          dbUser.role = roleForEmail(dbUser.email ?? "");
          dbUser.bio = dbUser.bio ?? "";
          await dbUser.save();
        }
      } catch (error) {
        console.error("Error populating Google OAuth user fields:", error);
      }
    },
  },
});
