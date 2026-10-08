// The paper engine: draws the template (exact boxes with fold lines and glue tabs) and the assembled preview as SVG text.
// The AI only supplies the printed surfaces; every shape here is fixed, so the toy always folds together.
import type { Colors, Fig, Kind, Outfit, Paper, Sticker } from "./types";
import { clubOutfitArt, clubStickerArt, outfitPlace, SCENE_FLOOR, sceneArt, type Collection } from "./club";

export type Opts = { line?: boolean; img?: (id: string) => string };
type Words = { head: string; body: string; leg: string; arm: string; hand: string; ear: string; tail: string; muzzle: string; foot: string; hair: string; extra: string; cut: string; fold: string; glue: string; made: string; house: string; roof: string; box: string };
export const WORDS_EN: Words = { head: "Head", body: "Body", leg: "Leg", arm: "Arm", hand: "Hand", ear: "Ear", tail: "Tail", muzzle: "Muzzle", foot: "Foot", hair: "Hair", extra: "Extra", cut: "cut", fold: "fold", glue: "glue here", made: "Made with Foldifyer", house: "House", roof: "Roof", box: "Gift box" };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const n2 = (v: number) => Math.round(v * 100) / 100;
const TZ = Array.from({ length: 51 }, (_v, t) => `<clipPath id="tz${t}"><path d="M0 100H100L${100 - t} 0H${t}Z"/></clipPath>`).join("");
const DEFS = `<defs>${TZ}<clipPath id="sq"><rect width="100" height="100"/></clipPath><clipPath id="ear"><path d="M4 100L50 4L96 100Z"/></clipPath><clipPath id="tl"><path d="M30 100V40Q30 6 60 6Q84 6 80 30Q66 26 62 44V100Z"/></clipPath></defs>`;

/* ── drawn samples (demo figures, and the outlines of the colouring version) ── */

type Preset = { kind: Kind; animal?: "cat" | "dog"; colors: Colors; stripe?: string; patch?: string; eye: string; long?: boolean };
const base: Colors = { fur: "#E8A24C", fur2: "#FFF3E0", inner: "#F4B6B0", skin: "#F2C7A5", hair: "#6B3F2A", top: "#E4572E", bottom: "#3D5A99", shoes: "#F4F1EA" };
export const PRESETS: Record<string, Preset> = {
  cat: { kind: "pet", animal: "cat", colors: { ...base }, stripe: "#C9782B", eye: "#6FA84A" },
  greycat: { kind: "pet", animal: "cat", colors: { ...base, fur: "#9AA1AB", fur2: "#F1F3F5", inner: "#E9B4B4" }, stripe: "#6E7580", eye: "#E0B43A" },
  dog: { kind: "pet", animal: "dog", colors: { ...base, fur: "#B07A4A", fur2: "#F7EBDC", inner: "#D99A8E" }, patch: "#6B4426", eye: "#3A2416" },
  girl: { kind: "person", colors: { ...base }, eye: "#4A2E1B", long: true },
  boy: { kind: "person", colors: { ...base, skin: "#E3B089", hair: "#2B2118", top: "#3FA796", bottom: "#4A4E69", shoes: "#D94F4F" }, eye: "#2B2118" },
};

function drawTile(p: Preset, n: number, line: boolean): string {
  const f = (col: string) => (line ? `fill="#fff" stroke="#666" stroke-width="1.4"` : `fill="${col}"`);
  const ink = line ? "#666" : "#4A2E1B";
  const c = p.colors;
  const bg = (col: string) => `<rect width="100" height="100" fill="${line ? "#fff" : col}"/>`;
  if (n > 3) {
    const dark = line ? "#666" : "#00000030";
    if (p.kind === "pet") {
      if (n === 4 || n === 6) return drawTile(p, 2, line); // coat, tail
      const toes = `<path d="M34 78V100M50 76V100M66 78V100" stroke="${dark}" stroke-width="2.5" stroke-linecap="round"/>`;
      if (n === 5) return bg(c.fur) + (p.stripe ? `<path d="M0 22Q50 12 100 22V31Q50 21 0 31Z M0 46Q50 36 100 46V55Q50 45 0 55Z" ${f(p.stripe)}/>` : "") + `<path d="M0 72Q50 62 100 72V100H0Z" ${f(c.fur2)}/>` + toes; // front leg with the paw
      if (n === 7) return bg(c.fur2) + `<path d="M30 40V100M50 34V100M70 40V100" stroke="${dark}" stroke-width="2.5" stroke-linecap="round"/>`; // paw from above
      return bg(c.fur) + `<path d="M24 100L50 32L76 100Z" ${f(c.inner)}/>`; // inside of the ear
    }
    if (n === 4) return bg(c.top);
    if (n === 5) return bg(c.top) + `<path d="M0 20H100" stroke="${dark}" stroke-width="2"/>`; // sleeve
    if (n === 6) return bg(c.bottom) + `<path d="M50 0V100" stroke="${dark}" stroke-width="2"/>`; // trouser leg
    const laces = `<path d="M34 30H66M34 44H66M34 58H66" stroke="${line ? "#666" : "#9AA0A6"}" stroke-width="3" stroke-linecap="round"/>`;
    if (n === 7) return bg(c.shoes) + `<rect y="80" width="100" height="20" ${f("#D9D4C8")}/><path d="M56 20L78 44M64 14L86 38" stroke="${line ? "#666" : "#9AA0A6"}" stroke-width="3" stroke-linecap="round"/>`; // shoe from the side
    return bg(c.shoes) + laces; // shoe from above
  }
  if (p.kind === "pet") {
    const st = p.stripe;
    if (n === 0) {
      const cat = p.animal !== "dog";
      const eye = (x: number) => `<circle cx="${x}" cy="42" r="9" ${f(p.eye)}/>${cat ? `<ellipse cx="${x}" cy="42" rx="3" ry="7" fill="${line ? "#666" : "#1B1410"}"/>` : `<circle cx="${x}" cy="42" r="5.5" fill="${line ? "#666" : "#1B1410"}"/>`}${line ? "" : `<circle cx="${x - 3}" cy="39" r="2" fill="#fff"/>`}`;
      return bg(c.fur)
        + (st ? `<path d="M36 0L41 17L46 0Z M46 0L50 21L54 0Z M54 0L59 17L64 0Z M0 44L15 48L0 52Z M0 58L12 62L0 66Z M100 44L85 48L100 52Z M100 58L88 62L100 66Z" ${f(st)}/>` : "")
        + (p.patch ? `<ellipse cx="30" cy="40" rx="17" ry="19" ${f(p.patch)}/>` : "")
        + `<ellipse cx="50" cy="71" rx="27" ry="19" ${f(c.fur2)}/>` + eye(30) + eye(70)
        + (cat ? `<path d="M44 60H56L50 67Z" ${f(c.inner)}/>` : `<ellipse cx="50" cy="61" rx="9" ry="6.5" fill="${line ? "#666" : "#1B1410"}"/>`)
        + `<path d="M50 67Q50 76 41 75M50 67Q50 76 59 75" fill="none" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/>`
        + (cat ? `<path d="M31 69L8 64M31 73L8 78M69 69L92 64M69 73L92 78" stroke="${line ? "#666" : "#fff"}" stroke-width="1.2" stroke-linecap="round"/>` : `<path d="M45 76Q50 90 55 76Z" ${f("#E46A6A")}/>`);
    }
    if (n === 1) return bg(c.fur) + (st ? `<path d="M14 0L20 24L26 0Z M40 0L46 28L52 0Z M66 0L72 24L78 0Z" ${f(st)}/>` : p.patch ? `<ellipse cx="80" cy="30" rx="26" ry="30" ${f(p.patch)}/>` : "");
    if (n === 2) return bg(c.fur) + (st ? [16, 46, 76].map((y) => `<path d="M0 ${y}Q25 ${y - 8} 50 ${y}T100 ${y}V${y + 9}Q75 ${y + 1} 50 ${y + 9}T0 ${y + 9}Z" ${f(st)}/>`).join("") : p.patch ? `<ellipse cx="30" cy="40" rx="30" ry="24" ${f(p.patch)}/>` : "");
    return bg(c.fur) + `<ellipse cx="50" cy="38" rx="30" ry="48" ${f(c.fur2)}/>`;
  }
  if (n === 0) {
    const eye = (x: number) => `<ellipse cx="${x}" cy="50" rx="8" ry="6.5" ${f("#fff")}/><circle cx="${x}" cy="50" r="4.2" fill="${line ? "#666" : p.eye}"/>`;
    return bg(c.skin)
      + (p.long ? `<path d="M0 20H11V100H0Z M89 20H100V100H89Z" ${f(c.hair)}/>` : "")
      + `<path d="M0 0H100V32Q86 19 70 25Q50 31 30 23Q14 19 0 33Z" ${f(c.hair)}/>` + eye(32) + eye(68)
      + `<path d="M24 40Q32 36 40 40M60 40Q68 36 76 40" fill="none" stroke="${line ? "#666" : c.hair}" stroke-width="2.4" stroke-linecap="round"/>`
      + (line ? "" : `<circle cx="22" cy="67" r="7" fill="#F08A7A" opacity=".35"/><circle cx="78" cy="67" r="7" fill="#F08A7A" opacity=".35"/>`)
      + `<path d="M50 56Q47 63 51 64" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/><path d="M38 73Q50 84 62 73" fill="none" stroke="${line ? "#666" : "#B5524A"}" stroke-width="2.6" stroke-linecap="round"/>`;
  }
  if (n === 1) return bg(c.skin) + `<path d="M0 0H100V34Q72 27 56 40Q${p.long ? "46 60 46 100" : "42 56 30 62Q14 66 0 66"}${p.long ? "H0Z" : "Z"}" ${f(c.hair)}/><ellipse cx="62" cy="58" rx="7" ry="10" ${line ? f("#fff") : `fill="${c.skin}" stroke="#00000030" stroke-width="1.5"`}/>`;
  if (n === 2) return bg(c.hair) + (line ? `<path d="M20 0V100M50 0V100M80 0V100" stroke="#bbb" stroke-width="1"/>` : `<path d="M20 0Q26 50 20 100M50 0Q56 50 50 100M80 0Q86 50 80 100" fill="none" stroke="#00000022" stroke-width="2"/>`);
  return bg(c.top) + `<path d="M34 0L50 20L66 0Z" ${f(c.skin)}/><circle cx="50" cy="42" r="3" ${f("#ffffff")}/><circle cx="50" cy="62" r="3" ${f("#ffffff")}/><circle cx="50" cy="82" r="3" ${f("#ffffff")}/>`;
}

/* ── printed surfaces of one figure ── */

type Ctx = { fig: Fig; line: boolean; url?: string; p: Preset; c: Colors };
function ctxOf(fig: Fig, o: Opts): Ctx {
  const p = PRESETS[fig.preset ?? ""] ?? PRESETS[fig.kind === "pet" ? "cat" : "boy"];
  const url = !o.line && fig.atlas && o.img ? o.img(fig.atlas) : undefined;
  return { fig, line: !!o.line, url, p, c: fig.preset || !fig.colors ? p.colors : fig.colors };
}
/** Tile n of the 3×3 picture (see TILES in the server's ai.ts), as markup inside a 100×100 box. */
function tile(x: Ctx, n: number, mirror = false): string {
  let m: string;
  if (x.url) {
    const z = 1.06, col = n % 3, row = Math.floor(n / 3), off = (100 * z - 100) / 2; // zoomed a little so the seams between tiles never show
    m = `<g clip-path="url(#sq)"><image href="${esc(x.url)}" x="${n2(-col * 100 * z - off)}" y="${n2(-row * 100 * z - off)}" width="${300 * z}" height="${300 * z}" preserveAspectRatio="none"/></g>`;
  } else m = drawTile(x.p, n, x.line);
  return mirror ? `<g transform="translate(100,0) scale(-1,1)">${m}</g>` : m;
}
const crop = (m: string, rx: number, ry: number, rw: number, rh: number) => `<g clip-path="url(#sq)"><g transform="scale(${n2(100 / rw)},${n2(100 / rh)}) translate(${-rx},${-ry})">${m}</g></g>`;
const flat = (x: Ctx, col: string) => `<rect width="100" height="100" fill="${x.line ? "#fff" : col}"/>`;
/** A plain side with a band at the bottom (paw, hand, shoe). */
const banded = (x: Ctx, col: string, band: string, part = 24) => flat(x, col) + `<rect y="${100 - part}" width="100" height="${part}" fill="${x.line ? "#fff" : band}"${x.line ? ` stroke="#666" stroke-width="1.4"` : ""}/>`;

/* ── parts ── */

type Faces = { front: string; back: string; left: string; right: string; top: string; bottom: string };
/** A box. With `top` it narrows towards the top (width and depth up there; ~0 makes a pyramid). `open`: no bottom, it is glued on by tabs. */
type Box = { t: "box"; label: string; w: number; h: number; d: number; x: number; y: number; z: number; f: Faces; n?: number; top?: [number, number]; open?: boolean };
type Flat = { t: "flat"; label: string; w: number; h: number; art: string; x: number; y: number; z: number; n?: number };
type Part = Box | Flat;
const all = (m: string): Faces => ({ front: m, back: m, left: m, right: m, top: m, bottom: m });

function art(x: Ctx, kind: "ear" | "tail" | Outfit): string {
  const f = (col: string) => (x.line ? `fill="#fff" stroke="#666" stroke-width="1.6"` : `fill="${col}" stroke="#00000030" stroke-width="1"`);
  switch (kind) {
    // With a generated picture the ears and tail are cut out of the real fur, so they match the rest of the coat.
    case "ear": return `<g clip-path="url(#ear)">${tile(x, 8)}</g><path d="M4 100L50 4L96 100Z" fill="none" stroke="${x.line ? "#666" : "#00000030"}" stroke-width="1.2"/>`;
    case "tail": return `<g clip-path="url(#tl)">${tile(x, 6)}</g><path d="M30 100V40Q30 6 60 6Q84 6 80 30Q66 26 62 44V100Z" fill="none" stroke="${x.line ? "#666" : "#00000030"}" stroke-width="1.2"/>`;
    case "santa": return `<path d="M10 80Q28 8 80 14Q58 34 90 80Z" ${f("#D93B3B")}/><rect x="4" y="74" width="92" height="20" rx="10" ${f("#FFFFFF")}/><circle cx="82" cy="15" r="11" ${f("#FFFFFF")}/>`;
    case "party": return `<path d="M50 8L86 94H14Z" ${f("#5B8DEF")}/><path d="M38 38L66 46L70 58L33 50Z M26 70L78 80L82 92H18Z" ${f("#FFD166")}/><circle cx="50" cy="9" r="8" ${f("#EF476F")}/>`;
    case "crown": return `<path d="M8 92V34L30 60L50 20L70 60L92 34V92Z" ${f("#F5C542")}/><circle cx="50" cy="74" r="7" ${f("#EF476F")}/><circle cx="26" cy="76" r="5" ${f("#5B8DEF")}/><circle cx="74" cy="76" r="5" ${f("#5B8DEF")}/>`;
    case "bunny": return `<ellipse cx="30" cy="46" rx="14" ry="42" ${f("#FFFFFF")}/><ellipse cx="70" cy="46" rx="14" ry="42" ${f("#FFFFFF")}/><ellipse cx="30" cy="50" rx="6" ry="30" ${f("#F7B6C2")}/><ellipse cx="70" cy="50" rx="6" ry="30" ${f("#F7B6C2")}/><rect x="6" y="84" width="88" height="12" rx="6" ${f("#F7B6C2")}/>`;
    case "pumpkin": return `<rect x="45" y="6" width="10" height="18" rx="3" ${f("#5E8C3A")}/><ellipse cx="50" cy="58" rx="44" ry="36" ${f("#F28C28")}/><path d="M50 22V94M28 28Q16 58 28 90M72 28Q84 58 72 90" fill="none" stroke="${x.line ? "#666" : "#00000026"}" stroke-width="2"/><path d="M26 48L38 44L36 58Z M74 48L62 44L64 58Z M30 68Q50 86 70 68Q50 76 30 68Z" fill="${x.line ? "#666" : "#5A2E0A"}"/>`;
    case "heart": return `<path d="M50 90C8 60 4 30 26 18C40 10 50 22 50 31C50 22 60 10 74 18C96 30 92 60 50 90Z" ${f("#E63950")}/>`;
    default: return clubOutfitArt(kind, x.line);
  }
}

/** One sticker, drawn in the 100×100 box of the side it sits on (the face, or the chest for the bow tie). */
export function stickerArt(k: Sticker, pet: boolean, line = false): string {
  const club = clubStickerArt(k, pet, line);
  if (club) return club;
  const f = (col: string) => (line ? `fill="#fff" stroke="#555" stroke-width="1.6"` : `fill="${col}"`), ink = line ? "#555" : "#22201E", ey = pet ? 42 : 50, my = pet ? 80 : 68;
  switch (k) {
    case "glasses": return `<circle cx="30" cy="${ey}" r="14" fill="${line ? "none" : "#ffffff40"}" stroke="${ink}" stroke-width="3.5"/><circle cx="70" cy="${ey}" r="14" fill="${line ? "none" : "#ffffff40"}" stroke="${ink}" stroke-width="3.5"/><path d="M44 ${ey}H56M16 ${ey}H0M84 ${ey}H100" stroke="${ink}" stroke-width="3.5"/>`;
    case "shades": return `<rect x="12" y="${ey - 11}" width="34" height="22" rx="8" ${f("#22201E")}/><rect x="54" y="${ey - 11}" width="34" height="22" rx="8" ${f("#22201E")}/><path d="M46 ${ey - 4}H54M12 ${ey - 4}H0M88 ${ey - 4}H100" stroke="${ink}" stroke-width="4"/>`;
    case "moustache": return `<path d="M50 ${my - 3}C40 ${my - 11} 24 ${my - 6} 16 ${my + 6}C30 ${my + 9} 44 ${my + 6} 50 ${my + 1}C56 ${my + 6} 70 ${my + 9} 84 ${my + 6}C76 ${my - 6} 60 ${my - 11} 50 ${my - 3}Z" ${f("#3A2A1E")}/>`;
    case "bow": return `<path d="M76 14L58 4V24Z M76 14L94 4V24Z" ${f("#EC6FA5")}/><circle cx="76" cy="14" r="5" ${f("#D14B87")}/>`;
    case "tie": return `<path d="M50 12L28 2V22Z M50 12L72 2V22Z" ${f("#D93B3B")}/><circle cx="50" cy="12" r="5.5" ${f("#A82A2A")}/>`;
    case "flower": return [0, 72, 144, 216, 288].map((a) => `<circle cx="${n2(20 + 8 * Math.cos((a * Math.PI) / 180))}" cy="${n2(15 + 8 * Math.sin((a * Math.PI) / 180))}" r="6.5" ${f("#FF8FB1")}/>`).join("") + `<circle cx="20" cy="15" r="5" ${f("#FFD166")}/>`;
    case "star": return `<path d="M50 3L53.5 11.5L62.5 12L55.5 18L58 27L50 22L42 27L44.500 18L37.500 12L46.500 11.500Z" ${f("#FFD166")}/>`;
    case "blush": return line ? `<circle cx="18" cy="${ey + 20}" r="8" ${f("#fff")}/><circle cx="82" cy="${ey + 20}" r="8" ${f("#fff")}/>` : `<circle cx="18" cy="${ey + 20}" r="9" fill="#FF6F91" opacity=".5"/><circle cx="82" cy="${ey + 20}" r="9" fill="#FF6F91" opacity=".5"/>`;
    default: return `<path d="M0 ${ey - 22}L100 ${ey + 4}" stroke="${ink}" stroke-width="4"/><ellipse cx="30" cy="${ey}" rx="15" ry="13" ${f("#22201E")}/>`; // eye patch
  }
}

export function partsOf(fig: Fig, o: Opts = {}, w: Words = WORDS_EN): Part[] {
  const x = ctxOf(fig, o), c = x.c, lv = fig.level, hard = lv === "hard", out: Part[] = [];
  const HS = 44; // head cube, mm: four sides in a row still fit an A4 or Letter sheet
  const head = (y: number, z: number, top: string, back: string, bottom: string): Box => ({ t: "box", label: w.head, w: HS, h: HS, d: HS, x: -22, y, z, f: { front: tile(x, 0), left: tile(x, 1), right: tile(x, 1, true), back, top, bottom } });
  if (fig.kind === "pet") {
    const top = tile(x, 2), chest = tile(x, 3), coat = tile(x, 4), leg = tile(x, 5), tailT = tile(x, 6), paw = tile(x, 7), ear = tile(x, 8);
    if (lv === "easy") {
      // For small children: two boxes, flat ears and a flat tail.
      out.push({ t: "box", label: w.body, w: 40, h: 40, d: 30, x: -20, y: 0, z: 0, f: { ...all(coat), front: chest } });
      out.push(head(-7, 40, top, top, coat));
      for (const ex of [-20, 6]) out.push({ t: "flat", label: w.ear, w: 14, h: 15, art: art(x, "ear"), x: ex, y: 4, z: 84, n: 2 });
      out.push({ t: "flat", label: w.tail, w: 22, h: 36, art: art(x, "tail"), x: 18, y: 26, z: 2 });
    } else {
      // A sitting animal: a body that narrows upwards, two front legs, pyramid ears, a tail that bends up.
      const bh = 38, fz = hard ? 5 : 0;
      if (hard) {
        for (const lx of [-16, 3]) out.push({ t: "box", label: w.foot, w: 13, h: 5, d: 16, x: lx, y: -15, z: 0, f: { ...all(paw), front: paw }, n: 4 });
        for (const lx of [-31, 19]) out.push({ t: "box", label: w.foot, w: 12, h: 7, d: 20, x: lx, y: -6, z: 0, f: all(paw), n: 4 });
      }
      for (const lx of [-15, 4]) out.push({ t: "box", label: w.leg, w: 11, h: 24 - fz, d: 11, x: lx, y: -10, z: fz, f: { ...all(coat), front: hard ? coat : leg }, n: 2 });
      out.push({ t: "box", label: w.body, w: 42, h: bh, d: 38, top: [32, 30], x: -21, y: 0, z: 0, f: { ...all(coat), front: chest } });
      out.push({ t: "box", label: w.tail, w: 24, h: 9, d: 9, x: 19, y: 27, z: 0, f: all(tailT), n: 2 });
      out.push({ t: "box", label: w.tail, w: 9, h: 20, d: 9, x: 34, y: 27, z: 9, f: all(tailT), n: 2 });
      out.push(head(-8, bh, top, top, coat));
      if (hard) out.push({ t: "box", label: w.muzzle, w: 20, h: 14, d: 8, x: -10, y: -16, z: bh + 4, f: { ...all(flat(x, c.fur2)), front: crop(tile(x, 0), 27, 54, 46, 32) } });
      for (const ex of [-21, 6]) out.push({ t: "box", label: w.ear, w: 15, h: 16, d: 9, top: [0.01, 0.01], open: true, x: ex, y: 6, z: bh + HS, f: { ...all(coat), front: ear }, n: 2 });
    }
  } else {
    const hairT = tile(x, 2), chest = tile(x, 3), fabric = tile(x, 4), sleeve = tile(x, 5), trou = tile(x, 6), shoeS = tile(x, 7), shoeT = tile(x, 8);
    const hand = (m: string) => m + `<rect y="78" width="100" height="22" fill="${x.line ? "#fff" : c.skin}"${x.line ? ` stroke="#666" stroke-width="1.4"` : ""}/>`;
    if (lv === "easy") {
      // For small children: head and one tall body with the trousers and shoes printed on it.
      const tall = (m: string) => `<g transform="scale(1,.6)">${m}</g><g transform="translate(0,60) scale(1,.4)">${banded(x, c.bottom, c.shoes, 22)}</g>${x.line ? `<path d="M0 60H100" stroke="#666" stroke-width="1"/>` : ""}`;
      out.push({ t: "box", label: w.body, w: 36, h: 60, d: 24, x: -18, y: 1, z: 0, f: { ...all(tall(fabric)), front: tall(chest), top: fabric, bottom: flat(x, c.shoes) } });
      out.push(head(-9, 60, hairT, hairT, flat(x, c.skin)));
    } else {
      // A big head on a small body, like a collectible figure: shoes, legs, jacket, arms.
      for (const lx of [-16, 1]) out.push({ t: "box", label: w.foot, w: 15, h: 8, d: 24, x: lx, y: -8, z: 0, f: { front: shoeT, back: shoeT, top: shoeT, left: `<g transform="translate(100,0) scale(-1,1)">${shoeS}</g>`, right: shoeS, bottom: flat(x, c.shoes) }, n: 2 });
      for (const lx of [-15, 2]) out.push({ t: "box", label: w.leg, w: 13, h: 18, d: 14, x: lx, y: 2, z: 8, f: all(trou), n: 2 });
      out.push({ t: "box", label: w.body, w: 32, h: 30, d: 20, x: -16, y: 0, z: 26, f: { ...all(fabric), front: chest } });
      if (hard) for (const ax of [-26, 16]) out.push({ t: "box", label: w.hand, w: 10, h: 7, d: 12, x: ax, y: 4, z: 23, f: all(flat(x, c.skin)), n: 2 });
      for (const ax of [-26, 16]) out.push({ t: "box", label: w.arm, w: 10, h: 26, d: 12, x: ax, y: 4, z: 30, f: all(hard ? sleeve : hand(sleeve)), n: 2 });
      out.push(head(-10, 56, hairT, hairT, flat(x, c.skin)));
      if (hard) {
        for (const ex of [-27, 22]) out.push({ t: "box", label: w.ear, w: 5, h: 12, d: 8, x: ex, y: 10, z: 70, f: all(flat(x, c.skin)), n: 2 });
        out.push({ t: "box", label: w.hair, w: HS + 4, h: 7, d: HS + 4, x: -24, y: -12, z: 56 + HS, f: all(hairT) });
      }
    }
  }
  const st = fig.stickers ?? [], pet = fig.kind === "pet";
  if (st.length) for (const p of out) {
    if (p.t !== "box") continue;
    if (p.label === w.head) p.f = { ...p.f, front: p.f.front + st.filter((k) => k !== "tie").map((k) => stickerArt(k, pet, x.line)).join("") };
    if (p.label === w.body && st.includes("tie")) p.f = { ...p.f, front: p.f.front + stickerArt("tie", pet, x.line) };
  }
  if (fig.outfit !== "none") {
    const hd = out.find((p) => p.label === w.head)!, place = outfitPlace(fig.outfit), ground = place === "ground", held = place === "held";
    const s = ground ? 30 : held ? 22 : 40;
    // Hats sit on the head, the heart is held at the chest, the pumpkin stands beside the figure.
    out.push({ t: "flat", label: w.extra, w: s, h: s, art: art(x, fig.outfit), x: ground ? -66 : -s / 2, y: ground ? -8 : held ? hd.y - 6 : hd.y + HS / 2, z: ground ? 0 : held ? hd.z - 27 : hd.z + HS - 3 });
  }
  return out;
}
export const partCount = (fig: Fig) => partsOf(fig).length;

/* ── the assembled figure, seen from any side ── */

/* ── the same figure seen from any side (drag to turn) ── */

type V3 = [number, number, number];
type Group = { g: string; x: number; y: number; w: number; h: number };
function spinGroup(parts: Part[], yawDeg: number): Group {
  const boxes = parts.filter((p): p is Box => p.t === "box" && !p.open);
  const cx = boxes.reduce((m, b) => m + b.x + b.w / 2, 0) / (boxes.length || 1), cy = boxes.reduce((m, b) => m + b.y + b.d / 2, 0) / (boxes.length || 1);
  const a = (yawDeg * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a), ph = (18 * Math.PI) / 180, cp = Math.cos(ph), sp = Math.sin(ph);
  /** world point → [screen x, screen y, depth (bigger = farther)] */
  const P = ([x, y, z]: V3): V3 => { const dx = x - cx, dy = y - cy, xr = dx * ca - dy * sa, yr = dx * sa + dy * ca; return [xr, -(z * cp + yr * sp), yr * cp - z * sp]; };
  const quads: { m: string; depth: number }[] = [];
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  /** One side: A, B, C are the top-left, top-right and bottom-left corners of its rectangle; `t` > 0 cuts it to a trapezoid. */
  const quad = (A: V3, B: V3, C: V3, markup: string, dark: number, both = false, t = 0) => {
    const pa = P(A), pb = P(B), pc = P(C);
    const ux = (pb[0] - pa[0]) / 100, uy = (pb[1] - pa[1]) / 100, vx = (pc[0] - pa[0]) / 100, vy = (pc[1] - pa[1]) / 100;
    const facing = ux * vy - uy * vx; // > 0: we see its printed side
    if ((!both && facing <= 0.0005) || Math.abs(facing) < 0.0005) return;
    const pd: V3 = [pb[0] + pc[0] - pa[0], pb[1] + pc[1] - pa[1], pb[2] + pc[2] - pa[2]];
    for (const q of [pa, pb, pc, pd]) { minX = Math.min(minX, q[0]); maxX = Math.max(maxX, q[0]); minY = Math.min(minY, q[1]); maxY = Math.max(maxY, q[1]); }
    const k = Math.max(0, Math.min(50, Math.round(t)));
    quads.push({ depth: (pa[2] + pd[2]) / 2, m: `<g transform="matrix(${n2(ux)},${n2(uy)},${n2(vx)},${n2(vy)},${n2(pa[0])},${n2(pa[1])})">${both ? markup : `<g clip-path="url(#tz${k})">${markup}${dark ? `<rect width="100" height="100" fill="#000" opacity="${dark}"/>` : ""}</g><path d="M0 100H100L${100 - k} 0H${k}Z" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="1.2"/>`}</g>` });
  };
  for (const p of parts) {
    const { x, y, z, w, h } = p, z1 = z + h;
    if (p.t === "flat") { quad([x, y, z1], [x + w, y, z1], [x, y, z], p.art, 0, true); continue; }
    const y1 = y + p.d, x1 = x + w, [w2, d2] = p.top ?? [w, p.d], dx = (w - w2) / 2, dy = (p.d - d2) / 2, tw = (dx / w) * 100, td = (dy / p.d) * 100;
    // how much each wall is turned away from the light (the viewer's upper left)
    const lit = (nx: number, ny: number) => n2(Math.max(0, Math.min(0.3, 0.14 + 0.16 * (nx * ca - ny * sa))));
    quad([x, y + dy, z1], [x1, y + dy, z1], [x, y, z], p.f.front, lit(0, -1), false, tw);
    quad([x1, y1 - dy, z1], [x, y1 - dy, z1], [x1, y1, z], p.f.back, lit(0, 1), false, tw);
    quad([x1 - dx, y, z1], [x1 - dx, y1, z1], [x1, y, z], p.f.right, lit(1, 0), false, td);
    quad([x + dx, y1, z1], [x + dx, y, z1], [x, y1, z], p.f.left, lit(-1, 0), false, td);
    if (w2 >= 1) quad([x + dx, y1 - dy, z1], [x1 - dx, y1 - dy, z1], [x + dx, y + dy, z1], p.f.top, 0);
  }
  quads.sort((q1, q2) => q2.depth - q1.depth);
  return { g: quads.map((q) => q.m).join(""), x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
const VIEW = -24; // the angle of every still picture

/** A still picture, framed tightly. */
function svgOf(f: Group): string {
  const pad = 8;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n2(f.x - pad)} ${n2(f.y - pad)} ${n2(f.w + pad * 2)} ${n2(f.h + pad * 2 + 4)}" width="100%" height="100%">${DEFS}<ellipse cx="${n2(f.x + f.w / 2)}" cy="${n2(f.y + f.h - 3)}" rx="${n2(f.w * 0.46)}" ry="7" fill="#000" opacity=".1"/>${f.g}</svg>`;
}
/** A picture that is being turned: the frame is as wide as the figure can ever get, so it does not jump about. */
function spinOf(parts: Part[], yawDeg: number): string {
  const f = spinGroup(parts, yawDeg), pad = 8, R = Math.max(f.w, 90);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n2(-R / 2 - pad - 14)} ${n2(f.y - pad)} ${n2(R + pad * 2 + 28)} ${n2(f.h + pad * 2 + 6)}" width="100%" height="100%">${DEFS}<ellipse cx="0" cy="${n2(f.y + f.h - 3)}" rx="${n2(R * 0.5)}" ry="7" fill="#000" opacity=".1"/>${f.g}</svg>`;
}
/** Markup + bounding box of the assembled figure, to place inside any SVG. */
export const figureGroup = (fig: Fig, o: Opts = {}) => spinGroup(partsOf(fig, o), VIEW);
export const previewSvg = (fig: Fig, o: Opts = {}) => svgOf(figureGroup(fig, o));
export const figureSpin = (fig: Fig, yaw: number, o: Opts = {}) => spinOf(partsOf(fig, o), yaw);

/* ── step-by-step building: one kind of part per step, lowest first ── */

export type Step = { label: string; count: number; net: string; done: string };
export function buildSteps(fig: Fig, o: Opts = {}, w: Words = WORDS_EN): Step[] {
  const parts = partsOf(fig, o, w), groups = new Map<string, Part[]>();
  for (const p of parts) groups.set(p.label, [...(groups.get(p.label) ?? []), p]);
  const order = [...groups.entries()].sort((a, b) => Math.min(...a[1].map((p) => p.z)) - Math.min(...b[1].map((p) => p.z)));
  const sofar: Part[] = [];
  return order.map(([label, list]) => {
    sofar.push(...list);
    const piece = pieceOf(list[0], "");
    const net = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n2(piece.w + 4)} ${n2(piece.h)}" width="100%" height="100%">${DEFS}${piece.draw(2, 1)}</svg>`;
    // Parts not glued on yet stay as pale ghosts, so it is clear where the new one goes.
    const ghost = parts.filter((p) => !sofar.includes(p)).map((p): Part => (p.t === "box" ? { ...p, f: all(`<rect width="100" height="100" fill="#fff" opacity=".55"/>`) } : { ...p, art: "" }));
    return { label, count: list.length, net, done: svgOf(spinGroup([...sofar, ...ghost], VIEW)) };
  });
}

/* ── the printable template ── */

const T = 6; // glue tab depth, mm
type Piece = { w: number; h: number; draw: (ox: number, oy: number) => string };
const CUT = `stroke="#222" stroke-width=".3" stroke-linejoin="round"`;
const foldLine = (x1: number, y1: number, x2: number, y2: number) => `<path d="M${n2(x1)} ${n2(y1)}L${n2(x2)} ${n2(y2)}" stroke="#fff" stroke-width=".7"/><path d="M${n2(x1)} ${n2(y1)}L${n2(x2)} ${n2(y2)}" stroke="#444" stroke-width=".3" stroke-dasharray="1.8 1.4"/>`;
/** Glue tab on the edge a→b, sticking out to the side (nx, ny). */
function tab(ax: number, ay: number, bx: number, by: number, nx: number, ny: number): string {
  const len = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / len, uy = (by - ay) / len, s = Math.min(T * 0.7, len * 0.25);
  return `<path d="M${n2(ax)} ${n2(ay)}L${n2(ax + ux * s + nx * T)} ${n2(ay + uy * s + ny * T)}L${n2(bx - ux * s + nx * T)} ${n2(by - uy * s + ny * T)}L${n2(bx)} ${n2(by)}" fill="#EDEDED" ${CUT}/>` + foldLine(ax, ay, bx, by);
}
const label = (text: string, x: number, y: number, size = 3) => `<text x="${n2(x)}" y="${n2(y)}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" fill="#555">${esc(text)}</text>`;
const face = (m: string, x: number, y: number, w: number, h: number) => `<g transform="translate(${n2(x)},${n2(y)}) scale(${n2(w / 100)},${n2(h / 100)})">${m}</g><rect x="${n2(x)}" y="${n2(y)}" width="${w}" height="${h}" fill="none" ${CUT}/>`;

function boxPiece(b: { w: number; h: number; d: number; f: Faces }, text: string): Piece {
  const { w, h, d, f } = b;
  return {
    w: 2 * d + 2 * w + T, h: 2 * d + h + 2 * T + 5,
    draw: (ox, oy) => {
      const y0 = oy + T, y1 = y0 + d, y2 = y1 + h, y3 = y2 + d, xL = ox, xF = ox + d, xR = xF + w, xB = xR + d, xE = xB + w;
      return `<g>`
        + tab(xE, y1, xE, y2, 1, 0) + tab(xF, y0, xR, y0, 0, -1) + tab(xF, y1, xF, y0, -1, 0) + tab(xR, y0, xR, y1, 1, 0)
        + tab(xR, y3, xF, y3, 0, 1) + tab(xF, y3, xF, y2, -1, 0) + tab(xR, y2, xR, y3, 1, 0)
        + face(f.left, xL, y1, d, h) + face(f.front, xF, y1, w, h) + face(f.right, xR, y1, d, h) + face(f.back, xB, y1, w, h) + face(f.top, xF, y0, w, d) + face(f.bottom, xF, y2, w, d)
        + foldLine(xF, y1, xF, y2) + foldLine(xR, y1, xR, y2) + foldLine(xB, y1, xB, y2) + foldLine(xF, y1, xR, y1) + foldLine(xF, y2, xR, y2)
        + label(text, xL, y3 + T + 1.5) + `</g>`;
    },
  };
}
/* A part that narrows upwards (or a pyramid): the four slanted sides open out like a fan around the front one. */
type M2 = [number, number, number, number, number, number];
const mul = (m: M2, n: M2): M2 => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
const shift = (x: number, y: number): M2 => [1, 0, 0, 1, x, y];
const turn = (a: number): M2 => [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0];
const at = (m: M2, x: number, y: number): [number, number] => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
const mtx = (m: M2) => `matrix(${m.map((v) => Math.round(v * 10000) / 10000).join(",")})`;

function taperPiece(b: Box, text: string): Piece {
  const { w, h, d, f } = b, [w2, d2] = b.top!, dx = (w - w2) / 2, dy = (d - d2) / 2, hf = Math.hypot(h, dy), hs = Math.hypot(h, dx), flatTop = w2 >= 1;
  const make = (base: M2) => {
    const pts: [number, number][] = [];
    let faces = "", tabs = "", folds = "";
    const ang = Math.atan2;
    const mF = base, mR = mul(mul(mF, shift(w, 0)), turn(ang(-hf, -dx) - ang(-hs, dy))), mB = mul(mul(mR, shift(d, 0)), turn(ang(-hs, -dy) - ang(-hf, dx))), mL = mul(mul(mF, turn(ang(-hf, dx) - ang(-hs, -dy))), shift(-d, 0));
    /** A glue tab on the edge a→b (in the side's own millimetres), pointing away from the point `inside`. */
    const tabOn = (m: M2, a: [number, number], bb: [number, number], inside: [number, number]) => {
      const pa = at(m, ...a), pb = at(m, ...bb), pin = at(m, ...inside), len = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
      let nx = -(pb[1] - pa[1]) / len, ny = (pb[0] - pa[0]) / len;
      if (nx * (pin[0] - pa[0]) + ny * (pin[1] - pa[1]) > 0) { nx = -nx; ny = -ny; }
      tabs += tab(pa[0], pa[1], pb[0], pb[1], nx, ny);
      pts.push([pa[0] + nx * T, pa[1] + ny * T], [pb[0] + nx * T, pb[1] + ny * T]);
    };
    const fold = (m: M2, a: [number, number], bb: [number, number]) => { const pa = at(m, ...a), pb = at(m, ...bb); folds += foldLine(pa[0], pa[1], pb[0], pb[1]); };
    /** One slanted side: bottom edge W, slant height H, narrowing by tx on each side. */
    const side = (m: M2, W: number, H: number, tx: number, tex: string) => {
      const k = Math.max(0, Math.min(50, Math.round((tx / W) * 100))), poly = ([[0, 0], [W, 0], [W - tx, -H], [tx, -H]] as [number, number][]).map((q) => at(m, ...q));
      pts.push(...poly);
      faces += `<g transform="${mtx(mul(mul(m, shift(0, -H)), [W / 100, 0, 0, H / 100, 0, 0]))}"><g clip-path="url(#tz${k})">${tex}</g></g><path d="M${poly.map((q) => `${n2(q[0])} ${n2(q[1])}`).join("L")}Z" fill="none" ${CUT}/>`;
      if (b.open) tabOn(m, [0, 0], [W, 0], [W / 2, -H / 2]); // glued onto the figure by its base
    };
    const rect = (x0: number, y0: number, rw: number, rh: number, tex: string) => {
      const poly = ([[x0, y0], [x0 + rw, y0], [x0 + rw, y0 + rh], [x0, y0 + rh]] as [number, number][]).map((q) => at(mF, ...q));
      pts.push(...poly);
      faces += `<g transform="${mtx(mul(mul(mF, shift(x0, y0)), [rw / 100, 0, 0, rh / 100, 0, 0]))}">${tex}</g><path d="M${poly.map((q) => `${n2(q[0])} ${n2(q[1])}`).join("L")}Z" fill="none" ${CUT}/>`;
      const mid: [number, number] = [x0 + rw / 2, y0 + rh / 2], far = y0 < 0 ? y0 : y0 + rh;
      tabOn(mF, [x0, y0], [x0, y0 + rh], mid); tabOn(mF, [x0 + rw, y0], [x0 + rw, y0 + rh], mid); tabOn(mF, [x0, far], [x0 + rw, far], mid);
    };
    side(mL, d, hs, dy, f.left); side(mF, w, hf, dx, f.front); side(mR, d, hs, dy, f.right); side(mB, w, hf, dx, f.back);
    tabOn(mB, [w, 0], [w - dx, -hf], [w / 2, -hf / 2]); // closes the ring
    fold(mF, [0, 0], [dx, -hf]); fold(mF, [w, 0], [w - dx, -hf]); fold(mR, [d, 0], [d - dy, -hs]);
    if (flatTop) { rect(dx, -hf - d2, w2, d2, f.top); fold(mF, [dx, -hf], [w - dx, -hf]); }
    if (!b.open) { rect(0, 0, w, d, f.bottom); fold(mF, [0, 0], [w, 0]); }
    return { svg: tabs + faces + folds, pts };
  };
  const probe = make([1, 0, 0, 1, 0, 0]).pts, minX = Math.min(...probe.map((q) => q[0])), maxX = Math.max(...probe.map((q) => q[0])), minY = Math.min(...probe.map((q) => q[1])), maxY = Math.max(...probe.map((q) => q[1]));
  return { w: maxX - minX, h: maxY - minY + 5, draw: (ox, oy) => `<g>${make([1, 0, 0, 1, ox - minX, oy - minY]).svg}${label(text, ox, oy + maxY - minY + 3.5)}</g>` };
}
const pieceOf = (p: Part, text: string): Piece => (p.t === "flat" ? flatPiece(p, text) : p.top ? taperPiece(p, text) : boxPiece(p, text));

function flatPiece(p: { w: number; h: number; art: string }, text: string): Piece {
  return {
    w: Math.max(p.w, 18), h: p.h + T + 5,
    draw: (ox, oy) => `<g><g transform="translate(${n2(ox)},${n2(oy)}) scale(${p.w / 100},${p.h / 100})">${p.art}</g><rect x="${n2(ox + p.w * 0.2)}" y="${n2(oy + p.h)}" width="${n2(p.w * 0.6)}" height="${T}" fill="#EDEDED" ${CUT}/>${foldLine(ox + p.w * 0.2, oy + p.h, ox + p.w * 0.8, oy + p.h)}${label(text, ox, oy + p.h + T + 3.5)}</g>`,
  };
}

export const PAGE: Record<Paper, [number, number]> = { a4: [210, 297], letter: [215.9, 279.4] };
const M = 9, TOP = 9;

/** Puts pieces on as few sheets as possible (rows, tallest first). */
function layout(pieces: Piece[], paper: Paper, title: string, w: Words, mark: boolean): string[] {
  const [PW, PH] = PAGE[paper], pages: string[][] = [[]];
  // Shelves: each row remembers how much room is left, so small parts fill the gaps beside big ones.
  const rows: { page: number; y: number; h: number; x: number }[] = [];
  const bottom = (page: number) => rows.filter((r) => r.page === page).reduce((m, r) => Math.max(m, r.y + r.h + 3), M + TOP);
  for (const p of [...pieces].sort((a, b) => b.h - a.h)) {
    let row = rows.find((r) => p.h <= r.h && r.x + p.w <= PW - M);
    if (!row) {
      let page = 0;
      while (bottom(page) + p.h > PH - M - 5 && bottom(page) > M + TOP) page++;
      while (pages.length <= page) pages.push([]);
      row = { page, y: bottom(page), h: p.h, x: M }; rows.push(row);
    }
    pages[row.page].push(p.draw(row.x, row.y));
    row.x += p.w + 4;
  }
  return pages.map((body, k) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PW} ${PH}" width="${PW}mm" height="${PH}mm">${DEFS}<rect width="${PW}" height="${PH}" fill="#fff"/>`
    + `<text x="${M}" y="${M + 4}" font-family="Arial, Helvetica, sans-serif" font-size="5" font-weight="700" fill="#222">${esc(title)}${pages.length > 1 ? `  ${k + 1}/${pages.length}` : ""}</text>`
    + `<path d="M${PW - 96} ${M + 2.5}h9" stroke="#222" stroke-width=".3"/>${label(w.cut, PW - 85, M + 3.6)}<path d="M${PW - 68} ${M + 2.5}h9" stroke="#444" stroke-width=".3" stroke-dasharray="1.8 1.4"/>${label(w.fold, PW - 57, M + 3.6)}<rect x="${PW - 40}" y="${M}" width="7" height="4.5" fill="#EDEDED" stroke="#222" stroke-width=".3"/>${label(w.glue, PW - 31, M + 3.6)}`
    + body.join("") + (mark ? `<text x="${PW / 2}" y="${PH - M + 2}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="4" font-weight="700" fill="#999">${esc(w.made)}</text>` : "") + `</svg>`);
}

/** Every sheet of one figure. */
export const figureSheets = (fig: Fig, paper: Paper, o: Opts = {}, w: Words = WORDS_EN) => sheetsOf(partsOf(fig, o, w), paper, fig.name || "Foldifyer", w, fig.free);
function sheetsOf(parts: Part[], paper: Paper, title: string, w: Words, mark: boolean): string[] {
  const seen = new Map<string, number>();
  const pieces = parts.map((p) => {
    const k = (seen.get(p.label) ?? 0) + 1; seen.set(p.label, k);
    const text = p.n ? `${p.label} ${k}/${p.n}` : p.label;
    return pieceOf(p, text);
  });
  return layout(pieces, paper, title, w, mark);
}

/* ── gifts and sets ── */

const wrapText = (s: string, max: number) => { const out: string[] = []; let cur = ""; for (const word of s.split(/\s+/)) { if ((cur + " " + word).trim().length > max && cur) { out.push(cur); cur = word; } else cur = (cur + " " + word).trim(); } if (cur) out.push(cur); return out.slice(0, 3); };

/** A folding card: print, fold in half, write inside. */
export function cardSheet(fig: Fig, caption: string, paper: Paper, o: Opts = {}, w: Words = WORDS_EN, tint = "#FFE9C7"): string {
  const [PW, PH] = PAGE[paper], f = figureGroup(fig, o), half = PH / 2, s = Math.min((PW - 70) / f.w, (half - 46) / f.h);
  const lines = wrapText(caption, 22), col = o.line ? "#fff" : tint;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PW} ${PH}" width="${PW}mm" height="${PH}mm">${DEFS}<rect width="${PW}" height="${PH}" fill="#fff"/>`
    + `<rect x="0" y="${half}" width="${PW}" height="${half}" fill="${col}"/>`
    + `<g transform="translate(${n2(PW / 2 - (f.x + f.w / 2) * s)},${n2(half + 10 - f.y * s)}) scale(${n2(s)})">${f.g}</g>`
    + lines.map((l, k) => `<text x="${PW / 2}" y="${n2(PH - 22 + k * 11 - (lines.length - 1) * 5.5)}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="9.5" font-weight="700" fill="#2B2118">${esc(l)}</text>`).join("")
    + `<g transform="rotate(180 ${PW / 2} ${half / 2})"><text x="${PW / 2}" y="${half - 14}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="4" font-weight="700" fill="#999">${esc(w.made)}</text></g>`
    + foldLine(0, half, PW, half) + label(w.fold, 4, half - 2) + `</svg>`;
}

/** A small gift box with the face on the front and the words on the lid. */
export function giftBoxSheet(fig: Fig, caption: string, paper: Paper, o: Opts = {}, w: Words = WORDS_EN, tint = "#FFD9A0"): string[] {
  const x = ctxOf(fig, o), side = flat(x, tint), lines = wrapText(caption, 12);
  const lid = side + lines.map((l, k) => `<text x="50" y="${52 + k * 15 - (lines.length - 1) * 7.5}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="700" fill="#2B2118">${esc(l)}</text>`).join("");
  const dots = side + (o.line ? "" : `<circle cx="25" cy="25" r="6" fill="#fff" opacity=".6"/><circle cx="75" cy="25" r="6" fill="#fff" opacity=".6"/><circle cx="50" cy="50" r="6" fill="#fff" opacity=".6"/><circle cx="25" cy="75" r="6" fill="#fff" opacity=".6"/><circle cx="75" cy="75" r="6" fill="#fff" opacity=".6"/>`);
  return layout([boxPiece({ w: 44, h: 44, d: 44, f: { front: tile(x, 0), back: dots, left: dots, right: dots, top: lid, bottom: side } }, w.box)], paper, `${w.box} · ${fig.name}`, w, fig.free);
}

/** A little house (or a kennel for a pet) with the name over the door. */
export function houseSheet(name: string, pet: boolean, paper: Paper, o: Opts = {}, w: Words = WORDS_EN): string[] {
  const line = !!o.line, wall = line ? "#fff" : pet ? "#E9C58F" : "#F6E3C5", roofC = line ? "#fff" : pet ? "#B5523B" : "#C8553D", W = 50, D = 42, H = 40, G = 22, slope = Math.hypot(W / 2, G);
  const walls: Piece = {
    w: 2 * W + 2 * D + T, h: G + H + T + 5,
    draw: (ox, oy) => {
      const y1 = oy + G, y2 = y1 + H, xs = [ox, ox + W, ox + W + D, ox + 2 * W + D, ox + 2 * W + 2 * D];
      const gable = (x: number) => `<path d="M${x} ${y2}V${y1}L${x + W / 2} ${oy}L${x + W} ${y1}V${y2}Z" fill="${wall}" ${CUT}/>`;
      const door = pet ? `<path d="M${ox + 14} ${y2}V${y1 + 16}Q${ox + 25} ${y1 - 2} ${ox + 36} ${y1 + 16}V${y2}Z" fill="${line ? "#fff" : "#3A2A1E"}" ${CUT}/>` : `<rect x="${ox + 8}" y="${y1 + 10}" width="13" height="30" fill="${line ? "#fff" : "#8A5A3C"}" ${CUT}/><rect x="${ox + 28}" y="${y1 + 10}" width="14" height="14" fill="${line ? "#fff" : "#BFE3F2"}" ${CUT}/><path d="M${ox + 35} ${y1 + 10}v14M${ox + 28} ${y1 + 17}h14" stroke="#222" stroke-width=".3"/>`;
      return `<g>${tab(xs[4], y1, xs[4], y2, 1, 0)}${gable(xs[0])}${gable(xs[2])}<rect x="${xs[1]}" y="${y1}" width="${D}" height="${H}" fill="${wall}" ${CUT}/><rect x="${xs[3]}" y="${y1}" width="${D}" height="${H}" fill="${wall}" ${CUT}/>`
        + tab(xs[1], y1, xs[2], y1, 0, -1) + tab(xs[3], y1, xs[4], y1, 0, -1)
        + door + `<text x="${ox + W / 2}" y="${y1 - 1}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="5" font-weight="700" fill="#2B2118">${esc(name.slice(0, 12))}</text>`
        + foldLine(xs[1], y1, xs[1], y2) + foldLine(xs[2], y1, xs[2], y2) + foldLine(xs[3], y1, xs[3], y2) + label(w.house, ox, y2 + T + 2) + `</g>`;
    },
  };
  const rw = D + 8, roof: Piece = {
    w: rw, h: slope * 2 + 5,
    draw: (ox, oy) => `<g><rect x="${ox}" y="${oy}" width="${rw}" height="${n2(slope * 2)}" fill="${roofC}" ${CUT}/>${line ? "" : [0.25, 0.5, 0.75].map((k) => `<path d="M${ox} ${n2(oy + slope * k)}h${rw}M${ox} ${n2(oy + slope + slope * k)}h${rw}" stroke="#00000030" stroke-width=".4"/>`).join("")}${foldLine(ox, oy + slope, ox + rw, oy + slope)}${label(w.roof, ox, oy + slope * 2 + 3.5)}</g>`,
  };
  return layout([walls, roof], paper, `${w.house} · ${name}`, w, false);
}

/** The scene of a collection as a standing backdrop: the picture stands up, the strip below it lies flat as the floor. */
export function sceneSheet(id: Collection["id"], title: string, paper: Paper, w: Words = WORDS_EN): string {
  const [PW, PH] = PAGE[paper], sw = PW - 2 * M, sh = (sw * 2) / 3, y0 = M + TOP, fl = Math.min(70, PH - y0 - sh - M - 6);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PW} ${PH}" width="${PW}mm" height="${PH}mm">${DEFS}<rect width="${PW}" height="${PH}" fill="#fff"/>`
    + `<text x="${M}" y="${M + 4}" font-family="Arial, Helvetica, sans-serif" font-size="5" font-weight="700" fill="#222">${esc(title)}</text>`
    + `<g transform="translate(${M},${y0}) scale(${n2(sw / 300)})">${sceneArt(id)}</g><rect x="${M}" y="${n2(y0 + sh)}" width="${sw}" height="${n2(fl)}" fill="${SCENE_FLOOR[id]}"/>`
    + `<rect x="${M}" y="${y0}" width="${sw}" height="${n2(sh + fl)}" fill="none" ${CUT}/>` + foldLine(M, y0 + sh, M + sw, y0 + sh) + label(w.fold, M + 2, y0 + sh - 1.5)
    + `<text x="${PW / 2}" y="${PH - M + 2}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="4" font-weight="700" fill="#999">${esc(w.made)}</text></svg>`;
}

/** One printable document: every sheet on its own page. */
export function printHtml(sheets: string[], paper: Paper): string {
  const [w, h] = PAGE[paper];
  return `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:${w}mm ${h}mm;margin:0}html,body{margin:0;padding:0;background:#fff}svg{display:block;width:${w}mm;height:${h}mm;page-break-after:always;break-after:page}svg:last-child{page-break-after:auto;break-after:auto}</style></head><body>${sheets.join("")}</body></html>`;
}
