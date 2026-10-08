// Generated pictures live in MongoDB GridFS, or in Cloudflare R2 when it is configured.
// The photo a figure is made from is NEVER stored: it only passes through memory on its way to the image model.
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { imageBucket, images } from "./db.js";
import { env, r2On } from "./env.js";

let s3: S3Client | null = null;
const r2 = () => (s3 ??= new S3Client({ region: "auto", endpoint: `https://${env.r2.accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId: env.r2.accessKey, secretAccessKey: env.r2.secret } }));
const ext = (type: string) => (type === "image/webp" ? "webp" : type === "image/png" ? "png" : "jpg");

export async function putImage(deviceId: string, buf: Buffer, type: string): Promise<string> {
  const id = randomUUID().replace(/-/g, "");
  if (r2On()) {
    await r2().send(new PutObjectCommand({ Bucket: env.r2.bucket, Key: `${id}.${ext(type)}`, Body: buf, ContentType: type, CacheControl: "public, max-age=31536000, immutable" }));
    await images().insertOne({ _id: id, deviceId, createdAt: new Date(), r2: true, type });
    return id;
  }
  const fileId = await new Promise<import("mongodb").ObjectId>((resolve, reject) => {
    const up = imageBucket().openUploadStream(id, { metadata: { contentType: type } });
    Readable.from(buf).pipe(up).on("error", reject).on("finish", () => resolve(up.id));
  });
  await images().insertOne({ _id: id, deviceId, createdAt: new Date(), fileId, type });
  return id;
}

export async function readImage(id: string): Promise<{ redirect: string } | { stream: Readable; type: string } | null> {
  const doc = await images().findOne({ _id: id });
  if (!doc) return null;
  if (doc.r2) return { redirect: `${env.r2.publicUrl}/${id}.${ext(doc.type)}` };
  if (!doc.fileId) return null;
  return { stream: imageBucket().openDownloadStream(doc.fileId), type: doc.type };
}

/** The bytes of a stored picture (to hand a garment to the image model). */
export async function imageBytes(id: string): Promise<{ buf: Buffer; type: string } | null> {
  const got = await readImage(id);
  if (!got) return null;
  if ("redirect" in got) {
    const res = await fetch(got.redirect, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    return { buf: Buffer.from(await res.arrayBuffer()), type: res.headers.get("content-type") || "image/jpeg" };
  }
  const chunks: Buffer[] = [];
  for await (const ch of got.stream) chunks.push(ch as Buffer);
  return { buf: Buffer.concat(chunks), type: got.type };
}

export async function dropImages(ids: string[]) {
  for (const id of ids) {
    const doc = await images().findOneAndDelete({ _id: id });
    if (!doc) continue;
    try {
      if (doc.r2) await r2().send(new DeleteObjectCommand({ Bucket: env.r2.bucket, Key: `${id}.${ext(doc.type)}` }));
      else if (doc.fileId) await imageBucket().delete(doc.fileId);
    } catch (e) { console.warn("image delete", id, (e as Error).message); }
  }
}
