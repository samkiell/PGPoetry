import mongoose from "mongoose";
import { env } from "@/lib/env";

// Pre-register schemas to prevent lazy-load population errors
import "@/models/Poem";
import "@/models/Collection";
import "@/models/Comment";
import "@/models/Like";
import "@/models/Favorite";
import "@/models/User";

// Disable strict schema population checks globally
mongoose.set("strictPopulate", false);

/**
 * Mongoose connection helper.
 *
 * Next.js hot-reloads modules in dev and runs many serverless invocations in
 * prod, so we cache the connection promise on `globalThis` to avoid opening a
 * new pool on every request.
 */

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as unknown as {
  _mongoose?: MongooseCache;
};

const cache: MongooseCache =
  globalForMongoose._mongoose ?? { conn: null, promise: null };

globalForMongoose._mongoose = cache;

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 8000,
        // Schemas are the source of truth; reject unknown fields.
        bufferCommands: false,
      })
      .then((m) => {
        console.log("[db] MongoDB connected");
        return m;
      });
  }

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }

  return cache.conn;
}

