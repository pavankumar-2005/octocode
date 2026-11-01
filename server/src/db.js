import { MongoClient } from "mongodb";

let db;

export async function connectDb() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db(); // database name comes from the URI ("octocode")

  // createIndex does nothing if the index already exists, so this is safe on every start.
  await db.collection("users").createIndex({ email: 1 }, { unique: true }); // one account per email
  // TTL indexes: MongoDB deletes a document once its "expiresAt" date has passed.
  await db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection("rooms").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection("yjs_docs").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection("rooms").createIndex({ members: 1 }); // fast "my projects" lookup
  console.log("mongo connected");
}

export const getDb = () => db;
