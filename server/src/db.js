import { MongoClient } from "mongodb";

let db;

export async function connectDb() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db(); // database name comes from the URI ("octocode")
  console.log("mongo connected");
}

export const getDb = () => db;
