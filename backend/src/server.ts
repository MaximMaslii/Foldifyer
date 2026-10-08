import "./loadenv.js";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { Hono, type Context } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { SignJWT, jwtVerify } from "jose";

import { env, assertEnv, demoMode, r2On } from "./env.js";
import { connectDb, dbStats, devices, figs, images, ping, reports } from "./db.js";
import { isClub, packPurchases } from "./entitlement.js";
import { aiAtlas, aiReadPhoto } from "./ai.js";
import { dropImages, putImage, readImage } from "./store.js";
import { legalPage } from "./legal.js";
import { FREE_OUTFITS, KINDS, LEVELS, OUTFITS, STICKERS, type DeviceDoc, type FigDTO, type FigDoc, type Kind } from "./types.js";

assertEnv();
const secret = new TextEncoder().encode(env.jwtSecret);
type Vars = { Variables: { device: DeviceDoc } };
const app = new Hono<Vars>();

const fail = (c: Context, status: number, code: string, message?: string) => c.json({ error: code, message: message ?? code }, status as 400);

// In-memory limiter: fine for one server instance.
const hits = new Map<string, { n: number; reset: number }>();
function limited(key: string, max: number, windowSec: number) {
  const now = Date.now(), h = hits.get(key);
  if (!h || h.reset < now) { hits.set(key, { n: 1, reset: now + windowSec * 1000 }); return false; }
  return ++h.n > max;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (v.reset < now) hits.delete(k); }, 60_000).unref();

const ip = (c: Context) => (c.req.header("x-forwarded-for") || "").split(",")[0].trim() || "local";
const b64ok = (s: unknown): s is string => typeof s === "string" && s.length > 1000 && s.length < 4_000_000;
const dto = (f: FigDoc): FigDTO => { const { _id, deviceId: _d, createdAt, ...rest } = f; return { ...rest, id: _id, createdAt: createdAt.toISOString() }; };

app.use("*", cors({ origin: "*", allowHeaders: ["Authorization", "Content-Type"], allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] }));
app.onError((err, c) => { console.error(err); return fail(c, 500, "server_error", "Something went wrong"); });

/* ── public ── */

app.get("/", (c) => c.json({ ok: true, service: "Foldifyer API", demo: demoMode() }));
app.get("/health", async (c) => {
  try {
    await ping();
    const st = await dbStats().catch(() => null);
    const usedMb = st ? Math.round(((st.dataSize + st.indexSize) / 1048576) * 10) / 10 : null;
    const percent = usedMb === null ? null : Math.round((usedMb / env.mongoLimitMb) * 100);
    return c.json({ ok: true, db: "up", pictures_by: demoMode() ? "demo" : env.geminiImageModel, pictures: r2On() ? "r2" : "mongodb", storage: { usedMb, limitMb: env.mongoLimitMb, percent, picturesInDb: st?.pics ?? null } });
  } catch { return c.json({ ok: false, db: "down" }, 503); }
});
app.get("/legal/:doc", (c) => { const html = legalPage(c.req.param("doc")); return html ? c.html(html) : c.notFound(); });

// Picture ids are long random strings: only the app that made the figure knows them.
app.get("/v1/img/:id", async (c) => {
  const id = c.req.param("id");
  if (!/^[0-9a-f]{32}$/.test(id)) return c.notFound();
  const pic = await readImage(id);
  if (!pic) return c.notFound();
  if ("redirect" in pic) return c.redirect(pic.redirect, 302);
  return new Response(Readable.toWeb(pic.stream) as ReadableStream, { headers: { "Content-Type": pic.type, "Cache-Control": "private, max-age=604800", "Access-Control-Allow-Origin": "*" } });
});

/** No sign-up: the app gets an anonymous device id + token on first launch. */
app.post("/v1/device", async (c) => {
  if (limited(`dev:${ip(c)}`, 20, 3600)) return fail(c, 429, "rate_limited");
  const id = randomUUID();
  await devices().insertOne({ _id: id, createdAt: new Date(), lastSeenAt: new Date(), used: 0, credits: 0, rcSeen: [] });
  const token = await new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setSubject(id).setIssuedAt().sign(secret);
  return c.json({ deviceId: id, token });
});

/* ── authenticated ── */

app.use("/v1/*", async (c, next) => {
  const p = c.req.path;
  if (p === "/v1/device" || (p.startsWith("/v1/img/") && c.req.method === "GET")) return next();
  const token = (c.req.header("authorization") || "").replace(/^Bearer\s+/i, "");
  let id: string | undefined;
  try { id = (await jwtVerify(token, secret, { algorithms: ["HS256"] })).payload.sub; } catch { /* invalid */ }
  const device = id ? await devices().findOneAndUpdate({ _id: id }, { $set: { lastSeenAt: new Date() } }, { returnDocument: "after" }) : null;
  if (!device) return fail(c, 401, "unauthorized");
  c.set("device", device);
  await next();
});

const month = () => new Date().toISOString().slice(0, 7);
const clubLeftOf = (d: DeviceDoc) => Math.max(0, env.clubFigs - (d.clubMonth === month() ? d.clubUsed ?? 0 : 0));
const meOf = async (d: DeviceDoc, fresh = false) => {
  const club = await isClub(d._id, fresh);
  return { deviceId: d._id, plus: env.devAllPro, club, clubLeft: club ? clubLeftOf(d) : 0, credits: d.credits ?? 0, freeLeft: Math.max(0, env.freeFigs - d.used) };
};
app.get("/v1/me", async (c) => c.json(await meOf(c.get("device"), c.req.query("fresh") === "1")));

/** After a purchase in the store: turn new packs into figures (each store transaction counts once). */
app.post("/v1/credits/sync", async (c) => {
  let d = c.get("device");
  if (limited(`sync:${d._id}`, 30, 3600)) return fail(c, 429, "rate_limited");
  try {
    for (const [tx, product] of await packPurchases(d._id)) {
      const n = env.packs[product];
      if (!n) continue;
      const upd = await devices().findOneAndUpdate({ _id: d._id, rcSeen: { $ne: tx } }, { $push: { rcSeen: tx }, $inc: { credits: n } }, { returnDocument: "after" });
      if (upd) d = upd;
    }
  } catch (e) { console.error("credits sync", (e as Error).message); return fail(c, 503, "store_unavailable"); }
  return c.json(await meOf(d, true));
});

/* Figures */
app.post("/v1/figs", async (c) => {
  const d = c.get("device");
  const body = (await c.req.json().catch(() => ({}))) as { photo?: string; kind?: string; name?: string; adultOk?: boolean };
  const kind = KINDS.find((k) => k === body.kind);
  const name = String(body.name ?? "").trim().slice(0, 24);
  if (!kind || !b64ok(body.photo)) return fail(c, 400, "bad_request");
  const plus = env.devAllPro;
  if (limited(`fig:${d._id}`, env.perDay, 86400)) return fail(c, 429, "daily_limit");

  // Pay first (free figure → pack → nothing left); a failed figure is given back.
  // Order: this month's Club figures → the free figure → figures from packs.
  let paidWith: "plus" | "club" | "free" | "credit";
  const m = month(), club = !plus && (await isClub(d._id));
  if (plus) paidWith = "plus";
  else if (club && (await devices().findOneAndUpdate({ _id: d._id, clubMonth: m, clubUsed: { $lt: env.clubFigs } }, { $inc: { clubUsed: 1 } }))) paidWith = "club";
  else if (club && (await devices().findOneAndUpdate({ _id: d._id, clubMonth: { $ne: m } }, { $set: { clubMonth: m, clubUsed: 1 } }))) paidWith = "club";
  else if (await devices().findOneAndUpdate({ _id: d._id, used: { $lt: env.freeFigs } }, { $inc: { used: 1 } })) paidWith = "free";
  else if (await devices().findOneAndUpdate({ _id: d._id, credits: { $gt: 0 } }, { $inc: { credits: -1 } })) paidWith = "credit";
  else return fail(c, 402, "paywall");

  const doc: FigDoc = { _id: randomUUID(), deviceId: d._id, createdAt: new Date(), status: "generating", kind, name, outfit: "none", level: "normal", free: paidWith === "free" };
  await figs().insertOne(doc);
  void make(doc, body.photo, paidWith);
  return c.json({ id: doc._id });
});

/** Runs after the response; the app polls the figure. The photo only lives in memory here. */
async function make(doc: FigDoc, photo: string, paidWith: "plus" | "club" | "free" | "credit") {
  const refund = () => paidWith === "club" ? devices().updateOne({ _id: doc.deviceId, clubUsed: { $gt: 0 } }, { $inc: { clubUsed: -1 } }) : paidWith === "free" ? devices().updateOne({ _id: doc.deviceId }, { $inc: { used: -1 } }) : paidWith === "credit" ? devices().updateOne({ _id: doc.deviceId }, { $inc: { credits: 1 } }) : null;
  try {
    if (demoMode()) { await figs().updateOne({ _id: doc._id }, { $set: { status: "ready", preset: doc.kind === "pet" ? "cat" : "girl" } }); return; }
    const read = await aiReadPhoto(photo, doc.kind as Kind);
    if (read.verdict !== "ok") { await figs().updateOne({ _id: doc._id }, { $set: { status: "failed", reason: read.verdict } }); await refund(); return; }
    const pic = await aiAtlas(Buffer.from(photo, "base64"), doc.kind as Kind);
    const atlas = await putImage(doc.deviceId, pic.buf, pic.type);
    await figs().updateOne({ _id: doc._id }, { $set: { status: "ready", atlas, colors: read.colors } });
  } catch (e) {
    console.error("figure failed", (e as Error).message);
    await figs().updateOne({ _id: doc._id }, { $set: { status: "failed", reason: "error" } });
    await refund();
  }
}

app.get("/v1/figs", async (c) => {
  const list = await figs().find({ deviceId: c.get("device")._id, status: "ready" }).sort({ createdAt: -1 }).limit(200).toArray();
  return c.json({ figs: list.map(dto) });
});
app.get("/v1/figs/:id", async (c) => {
  const f = await figs().findOne({ _id: c.req.param("id"), deviceId: c.get("device")._id });
  if (!f) return fail(c, 404, "not_found");
  if (f.status === "generating" && Date.now() - f.createdAt.getTime() > 5 * 60_000) { f.status = "failed"; f.reason = "error"; await figs().updateOne({ _id: f._id }, { $set: { status: "failed", reason: "error" } }); }
  return c.json({ fig: dto(f) });
});
/** Name, outfit and difficulty can be changed any time: the app redraws the template itself, no AI needed. */
app.put("/v1/figs/:id", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { name?: string; outfit?: string; level?: string; stickers?: unknown };
  const set: Partial<FigDoc> = {};
  if (typeof body.name === "string") set.name = body.name.trim().slice(0, 24);
  const outfit = OUTFITS.find((o) => o === body.outfit), level = LEVELS.find((l) => l === body.level);
  const club = await isClub(c.get("device")._id);
  if (outfit && (club || FREE_OUTFITS.includes(outfit))) set.outfit = outfit;
  if (level) set.level = level;
  if (Array.isArray(body.stickers) && club) set.stickers = STICKERS.filter((s) => (body.stickers as unknown[]).includes(s));
  const f = await figs().findOneAndUpdate({ _id: c.req.param("id"), deviceId: c.get("device")._id }, { $set: set }, { returnDocument: "after" });
  return f ? c.json({ fig: dto(f) }) : fail(c, 404, "not_found");
});
/** "Report this picture": stores have to offer a way to flag AI-generated content. */
app.post("/v1/figs/:id/report", async (c) => {
  const d = c.get("device");
  if (limited(`report:${d._id}`, 20, 86400)) return fail(c, 429, "rate_limited");
  const f = await figs().findOne({ _id: c.req.param("id"), deviceId: d._id });
  if (!f) return fail(c, 404, "not_found");
  const body = (await c.req.json().catch(() => ({}))) as { reason?: string };
  await reports().insertOne({ figId: f._id, deviceId: d._id, image: f.atlas, reason: String(body.reason ?? "").slice(0, 300), at: new Date() });
  console.warn("REPORT", f._id, f.atlas ?? "(no picture)");
  return c.json({ ok: true });
});
app.delete("/v1/figs/:id", async (c) => {
  const f = await figs().findOneAndDelete({ _id: c.req.param("id"), deviceId: c.get("device")._id });
  if (f?.atlas) await dropImages([f.atlas]);
  return c.json({ ok: true });
});

/** "Delete all my data": every figure and picture of this device. Paid figures and the free one are not refilled. */
app.delete("/v1/data", async (c) => {
  const d = c.get("device");
  const pics = await images().find({ deviceId: d._id }, { projection: { _id: 1 } }).toArray();
  await dropImages(pics.map((p) => p._id));
  await figs().deleteMany({ deviceId: d._id });
  return c.json({ ok: true });
});

/** Devices not opened for 24 months: everything they left is removed (as the privacy policy promises). */
async function sweep() {
  const idle = await devices().find({ lastSeenAt: { $lt: new Date(Date.now() - 730 * 86400_000) } }, { projection: { _id: 1 } }).limit(200).toArray();
  for (const d of idle) {
    const pics = await images().find({ deviceId: d._id }, { projection: { _id: 1 } }).toArray();
    await dropImages(pics.map((p) => p._id));
    await figs().deleteMany({ deviceId: d._id });
    await devices().deleteOne({ _id: d._id });
  }
  await figs().deleteMany({ status: "failed", createdAt: { $lt: new Date(Date.now() - 86400_000) } });
}

await connectDb();
setInterval(() => { sweep().catch((e) => console.error("sweep", e)); }, 6 * 3600_000).unref();
serve({ fetch: app.fetch, port: env.port, hostname: "0.0.0.0" }, (i) => console.log(`Foldifyer API on :${i.port}${demoMode() ? " (demo AI)" : ""}`));
