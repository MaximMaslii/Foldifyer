// Writes the legal pages as static HTML into ../store/ (host them anywhere, e.g. GitHub Pages).
// Usage (PowerShell):  $env:LEGAL_NAME="Your Name"; $env:SUPPORT_EMAIL="you@example.com"; npm run legal
import "../src/loadenv.js";
import { mkdirSync, writeFileSync } from "node:fs";
process.env.LEGAL_STATIC = "1";
const { legalData, legalDocs, legalPage } = await import("../src/legal.js");
mkdirSync("../store", { recursive: true });
for (const d of legalDocs) { writeFileSync(`../store/${d}.html`, legalPage(d)!); console.log(`store/${d}.html`); }
// The app shows the same texts on its own screen (works offline and in the demo).
writeFileSync("../app/src/lib/legalData.json", JSON.stringify(legalData(), null, 1));
console.log("app/src/lib/legalData.json");
