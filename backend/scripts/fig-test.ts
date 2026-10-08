// Trial run without the app: turns test/photo.jpg into the nine printed tiles and saves them as test/tiles.png.
// Usage: put a photo into ../test/photo.jpg, then:  npm run figtest pet   (or: person)
import "../src/loadenv.js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
const { env } = await import("../src/env.js");
const { aiAtlas, aiReadPhoto } = await import("../src/ai.js");
const kind = process.argv[2] === "person" ? "person" : "pet";
const file = "../test/photo.jpg";
if (!env.geminiKey) { console.log("No GEMINI_API_KEY in backend/.env"); process.exit(1); }
if (!existsSync(file)) { console.log("Put a photo into the test folder and name it photo.jpg"); process.exit(1); }
const buf = readFileSync(file);
console.log(`1/2 Checking the photo (${kind})...`);
const read = await aiReadPhoto(buf.toString("base64"), kind);
console.log("   answer:", read.verdict, JSON.stringify(read.colors));
if (read.verdict !== "ok") process.exit(0);
console.log(`2/2 Drawing the tiles with ${env.geminiImageModel} (20-60 seconds)...`);
const t = Date.now();
const pic = await aiAtlas(buf, kind);
const out = `../test/tiles.${pic.type.includes("png") ? "png" : "jpg"}`;
writeFileSync(out, pic.buf);
console.log(`   done in ${Math.round((Date.now() - t) / 1000)} s → ${out}`);
console.log("   usage:", JSON.stringify(pic.usage ?? {}));
console.log("Open the picture: it must be 9 equal squares (3 rows of 3), no white gaps, no lines or labels.");
