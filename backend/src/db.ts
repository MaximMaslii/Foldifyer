import { GridFSBucket, MongoClient, type Db } from "mongodb";
import { env } from "./env.js";
import type { DeviceDoc, FigDoc, ImageDoc } from "./types.js";

let db: Db | null = null;

export async function connectDb() {
  const client = new MongoClient(env.mongoUri, { maxPoolSize: 10 });
  await client.connect();
  db = client.db(env.mongoDb);
  const results = await Promise.allSettled([
    db.collection("figs").createIndex({ deviceId: 1, createdAt: -1 }),
    db.collection("images").createIndex({ deviceId: 1 }),
    db.collection("devices").createIndex({ lastSeenAt: 1 }),
  ]);
  for (const r of results) if (r.status === "rejected") console.warn("index:", r.reason?.message);
  return db;
}

function d() {
  if (!db) throw new Error("DB not connected");
  return db;
}

export const devices = () => d().collection<DeviceDoc>("devices");
export const figs = () => d().collection<FigDoc>("figs");
export const reports = () => d().collection<{ figId: string; deviceId: string; image?: string; reason: string; at: Date }>("reports");
export const images = () => d().collection<ImageDoc>("images");
export const imageBucket = () => new GridFSBucket(d(), { bucketName: "pics" });
export const ping = () => d().command({ ping: 1 });

export async function dbStats() {
  const st = await d().command({ dbStats: 1 });
  const pics = await d().collection("pics.files").estimatedDocumentCount().catch(() => 0);
  return { dataSize: Number(st.dataSize) || 0, indexSize: Number(st.indexSize) || 0, pics };
}
