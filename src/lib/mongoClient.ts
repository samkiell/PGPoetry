import { MongoClient } from "mongodb";
import dns from "dns";
import { env } from "@/lib/env";

// Set default DNS servers to avoid querySrv ETIMEOUT issues on some local networks
try {
  dns.setServers(["1.1.1.1", "8.8.8.8"]);
} catch (e) {
  console.warn("[mongoClient] Failed to set public DNS servers:", e);
}

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
