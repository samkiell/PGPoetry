import { MongoClient } from "mongodb";
import { env } from "@/lib/env";

/**
 * Native MongoDB driver client — used only by the Auth.js MongoDB adapter.
 * App data access goes through Mongoose (`@/lib/db`); this exists because the
 * adapter needs a raw `MongoClient` promise.
 */

const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
};

function createClientPromise(): Promise<MongoClient> {
  const client = new MongoClient(env.MONGODB_URI);
  return client.connect();
}

const clientPromise: Promise<MongoClient> =
  globalForMongo._mongoClientPromise ?? createClientPromise();

if (process.env.NODE_ENV !== "production") {
  globalForMongo._mongoClientPromise = clientPromise;
}

export default clientPromise;
