// The Club: a themed collection for each month — outfits, stickers and a scene. Everything here is drawn by the app (no AI cost).
// The same ids are listed in the server's types.ts, which checks that only Club members can put them on a figure.

export type Collection = { id: "halloween" | "autumn" | "newyear" | "winter"; month: number; outfits: string[]; stickers: string[] };
export const COLLECTIONS: Collection[] = [
  { id: "halloween", month: 10, outfits: ["witch", "ghost", "candy"], stickers: ["fangs", "stitches", "web"] },
  { id: "autumn", month: 11, outfits: ["beanie", "leafcrown", "mug"], stickers: ["freckles", "monocle", "leaf"] },
  { id: "newyear", month: 12, outfits: ["antlers", "elf", "gift"], stickers: ["rednose", "snowflake", "holly"] },
  { id: "winter", month: 1, outfits: ["earmuffs", "snowman", "icecrown"], stickers: ["goggles", "frost", "snowstar"] },
];
/** The collection of this month (or the latest one, in months that have none yet). */
export function currentCollection(now = new Date()): Collection {
  const m = now.getMonth() + 1;
  for (let back = 0; back < 12; back++) { const hit = COLLECTIONS.find((c) => c.month === ((m - back + 11) % 12) + 1); if (hit) return hit; }
  return COLLECTIONS[0];
}
export const CLUB_OUTFITS = COLLECTIONS.flatMap((c) => c.outfits);
export const CLUB_STICKERS = COLLECTIONS.flatMap((c) => c.stickers);
/** Where an outfit goes: on the head, in the paws at the chest, or on the ground beside the figure. */
export const outfitPlace = (id: string): "hat" | "held" | "ground" => (["pumpkin", "ghost", "gift", "snowman"].includes(id) ? "ground" : ["heart", "candy", "mug"].includes(id) ? "held" : "hat");

type F = (col: string) => string;
const paint = (line: boolean): F => (col) => (line ? `fill="#fff" stroke="#666" stroke-width="1.6"` : `fill="${col}" stroke="#00000030" stroke-width="1"`);

/** A Club outfit in a 100×100 box, or "" when the id is not one. */
export function clubOutfitArt(id: string, line: boolean): string {
  const f = paint(line), ink = line ? "#666" : "#22201E";
  switch (id) {
    case "witch": return `<path d="M52 4L76 72H26Z" ${f("#5B3A8E")}/><ellipse cx="50" cy="76" rx="47" ry="13" ${f("#4A2E75")}/><path d="M31 58H71L74 68H28Z" ${f("#F28C28")}/>`;
    case "ghost": return `<path d="M20 96V44Q20 8 50 8Q80 8 80 44V96L68 86L58 96L50 86L42 96L32 86Z" ${f("#FFFFFF")}/><circle cx="39" cy="42" r="6" fill="${ink}"/><circle cx="61" cy="42" r="6" fill="${ink}"/><ellipse cx="50" cy="61" rx="6" ry="8" fill="${ink}"/>`;
    case "candy": return `<path d="M26 42Q50 0 74 42" fill="none" stroke="${ink}" stroke-width="4"/><circle cx="38" cy="38" r="9" ${f("#EC6FA5")}/><circle cx="54" cy="34" r="9" ${f("#FFD166")}/><circle cx="66" cy="40" r="8" ${f("#3FA796")}/><path d="M20 42H80L72 96H28Z" ${f("#F28C28")}/><path d="M38 60L44 54L46 62Z M62 60L56 54L54 62Z M38 76Q50 88 62 76Q50 80 38 76Z" fill="${ink}"/>`;
    case "beanie": return `<circle cx="50" cy="14" r="12" ${f("#F4F1EA")}/><path d="M12 80Q12 24 50 24Q88 24 88 80Z" ${f("#C8553D")}/><rect x="6" y="72" width="88" height="22" rx="9" ${f("#F4F1EA")}/>`;
    case "leafcrown": return [["#E4572E", 18, 58, -40], ["#F2B134", 34, 44, -18], ["#C8553D", 50, 38, 0], ["#F2B134", 66, 44, 18], ["#E4572E", 82, 58, 40]].map(([c, x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="10" ry="22" transform="rotate(${a} ${x} ${y})" ${f(String(c))}/>`).join("") + `<rect x="8" y="80" width="84" height="12" rx="6" ${f("#8A5A3C")}/>`;
    case "mug": return `<path d="M36 26Q30 16 38 8M52 26Q46 16 54 8" fill="none" stroke="${line ? "#666" : "#B9A994"}" stroke-width="3" stroke-linecap="round"/><path d="M68 48Q92 48 92 64Q92 80 68 80" fill="none" stroke="${line ? "#666" : "#C8553D"}" stroke-width="7"/><rect x="18" y="34" width="52" height="58" rx="8" ${f("#C8553D")}/><rect x="18" y="34" width="52" height="12" rx="6" ${f("#6B3F2A")}/>`;
    case "antlers": return `<path d="M30 92V52M30 64L12 46M30 52L20 26M30 52L42 30M70 92V52M70 64L88 46M70 52L80 26M70 52L58 30" fill="none" stroke="${line ? "#666" : "#8A5A3C"}" stroke-width="${line ? 3 : 8}" stroke-linecap="round"/><rect x="14" y="86" width="72" height="10" rx="5" ${f("#6B3F2A")}/>`;
    case "elf": return `<path d="M12 84Q30 20 86 12Q66 42 88 84Z" ${f("#2F8F5B")}/><path d="M8 84L18 72L28 84L38 72L48 84L58 72L68 84L78 72L92 84V94H8Z" ${f("#D93B3B")}/><circle cx="87" cy="11" r="9" ${f("#FFD166")}/>`;
    case "gift": return `<rect x="14" y="42" width="72" height="54" ${f("#D93B3B")}/><rect x="8" y="28" width="84" height="18" rx="3" ${f("#E4572E")}/><rect x="44" y="28" width="12" height="68" ${f("#FFD166")}/><path d="M50 28Q30 2 24 22Q30 30 50 28Q70 2 76 22Q70 30 50 28Z" ${f("#FFD166")}/>`;
    case "earmuffs": return `<path d="M14 72Q14 12 50 12Q86 12 86 72" fill="none" stroke="${line ? "#666" : "#5A4A3C"}" stroke-width="6"/><circle cx="15" cy="76" r="17" ${f("#EC6FA5")}/><circle cx="85" cy="76" r="17" ${f("#EC6FA5")}/>`;
    case "snowman": return `<circle cx="50" cy="70" r="27" ${f("#FFFFFF")}/><circle cx="50" cy="32" r="19" ${f("#FFFFFF")}/><rect x="36" y="2" width="28" height="16" ${f("#22201E")}/><rect x="28" y="16" width="44" height="5" ${f("#22201E")}/><circle cx="44" cy="30" r="2.5" fill="${ink}"/><circle cx="56" cy="30" r="2.5" fill="${ink}"/><path d="M50 35L66 39L50 42Z" ${f("#F28C28")}/><circle cx="50" cy="62" r="3" fill="${ink}"/><circle cx="50" cy="76" r="3" fill="${ink}"/>`;
    case "icecrown": return `<path d="M8 92V40L28 62L50 18L72 62L92 40V92Z" ${f("#9ED8F0")}/><path d="M50 52V84M36 60L64 76M64 60L36 76" stroke="${line ? "#666" : "#FFFFFF"}" stroke-width="3" stroke-linecap="round"/><circle cx="20" cy="80" r="4" ${f("#FFFFFF")}/><circle cx="80" cy="80" r="4" ${f("#FFFFFF")}/>`;
    default: return "";
  }
}

/** A Club sticker on the face (100×100); `pet` moves it to where an animal's eyes and mouth are. "" when the id is not one. */
export function clubStickerArt(id: string, pet: boolean, line: boolean): string {
  const f = paint(line), ink = line ? "#555" : "#22201E", ey = pet ? 42 : 50, my = pet ? 78 : 76, ny = pet ? 62 : 60;
  switch (id) {
    case "fangs": return `<path d="M38 ${my}L43 ${my + 14}L48 ${my}Z M52 ${my}L57 ${my + 14}L62 ${my}Z" ${f("#FFFFFF")}/>`;
    case "stitches": return `<path d="M60 ${ey - 28}L88 ${ey - 14}M66 ${ey - 31}L64 ${ey - 21}M74 ${ey - 27}L72 ${ey - 17}M82 ${ey - 23}L80 ${ey - 13}" fill="none" stroke="${ink}" stroke-width="2.6" stroke-linecap="round"/>`;
    case "web": return `<path d="M0 0L34 34M0 0L44 12M0 0L12 44M40 11Q30 24 31 31Q22 30 11 40M26 7Q20 16 20 20Q14 20 7 26" fill="none" stroke="${line ? "#555" : "#FFFFFF"}" stroke-width="2"/>`;
    case "freckles": return [[16, 0], [23, 5], [12, 7], [84, 0], [77, 5], [88, 7]].map(([x, d]) => `<circle cx="${x}" cy="${ey + 16 + d}" r="2.2" fill="${line ? "#555" : "#9A5B3A"}"/>`).join("");
    case "monocle": return `<circle cx="70" cy="${ey}" r="15" fill="${line ? "none" : "#ffffff40"}" stroke="${line ? "#555" : "#C9A227"}" stroke-width="3.5"/><path d="M82 ${ey + 9}Q96 ${ey + 30} 90 100" fill="none" stroke="${line ? "#555" : "#C9A227"}" stroke-width="2"/>`;
    case "leaf": return `<path d="M70 22Q72 2 94 4Q96 24 76 26Z" ${f("#E4572E")}/><path d="M72 24L92 6" stroke="${line ? "#555" : "#00000040"}" stroke-width="1.6"/>`;
    case "rednose": return `<circle cx="50" cy="${ny}" r="10" ${f("#E63950")}/>${line ? "" : `<circle cx="46" cy="${ny - 4}" r="3" fill="#fff" opacity=".7"/>`}`;
    case "snowflake": return `<path d="M50 3V27M39.600 9L60.400 21M60.400 9L39.600 21" fill="none" stroke="${line ? "#555" : "#BFE9FF"}" stroke-width="3.2" stroke-linecap="round"/>`;
    case "holly": return `<path d="M22 20Q4 14 6 2Q18 2 24 14Z M26 20Q44 14 42 2Q30 2 24 14Z" ${f("#2F8F5B")}/><circle cx="20" cy="22" r="4.500" ${f("#E63950")}/><circle cx="28" cy="22" r="4.500" ${f("#E63950")}/><circle cx="24" cy="16" r="4.500" ${f("#E63950")}/>`;
    case "goggles": return `<rect x="0" y="${ey - 6}" width="100" height="12" ${f("#22201E")}/><rect x="10" y="${ey - 16}" width="80" height="32" rx="14" ${f("#22201E")}/><rect x="16" y="${ey - 11}" width="68" height="22" rx="10" ${f("#F28C28")}/>${line ? "" : `<path d="M24 ${ey - 5}L40 ${ey - 5}" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`}`;
    case "frost": return line ? `<circle cx="18" cy="${ey + 20}" r="8" ${f("#fff")}/><circle cx="82" cy="${ey + 20}" r="8" ${f("#fff")}/>` : `<circle cx="18" cy="${ey + 20}" r="9" fill="#6EC1F0" opacity=".55"/><circle cx="82" cy="${ey + 20}" r="9" fill="#6EC1F0" opacity=".55"/>`;
    case "snowstar": return [[14, ey + 22], [86, ey + 22]].map(([x, y]) => `<path d="M${x} ${y - 7}V${y + 7}M${x - 6} ${y - 3.5}L${x + 6} ${y + 3.5}M${x + 6} ${y - 3.5}L${x - 6} ${y + 3.5}" stroke="${line ? "#555" : "#FFFFFF"}" stroke-width="2.4" stroke-linecap="round"/>`).join("");
    default: return "";
  }
}

/** The ground colour of a scene (the strip the figures stand on). */
export const SCENE_FLOOR: Record<Collection["id"], string> = { halloween: "#3B2A5C", autumn: "#C98A4B", newyear: "#F4F8FB", winter: "#F4F8FB" };
/** A backdrop drawn in a 300×200 box: sky and things far away; the figures stand in front of it. */
export function sceneArt(id: Collection["id"]): string {
  const dots = (pts: number[][], col: string, r = 2) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}"/>`).join("");
  const pumpkin = (x: number, y: number, s: number) => `<ellipse cx="${x}" cy="${y}" rx="${s}" ry="${s * 0.8}" fill="#F28C28"/><rect x="${x - 2}" y="${y - s}" width="4" height="6" fill="#5E8C3A"/>`;
  const fir = (x: number, y: number, s: number, col: string) => `<path d="M${x} ${y - s * 2.2}L${x + s} ${y - s}H${x + s * 0.5}L${x + s * 1.2} ${y}H${x - s * 1.2}L${x - s * 0.5} ${y - s}H${x - s}Z" fill="${col}"/>`;
  switch (id) {
    case "halloween": return `<rect width="300" height="200" fill="#2B1B4A"/><circle cx="232" cy="48" r="30" fill="#FFE9A8"/>${dots([[30, 30], [70, 60], [120, 24], [170, 70], [280, 110], [20, 100]], "#FFFFFF", 1.4)}<path d="M60 44l8 5 8-5-4 9-4-3-4 3zM150 40l8 5 8-5-4 9-4-3-4 3z" fill="#120A24"/><path d="M0 170Q80 120 150 160T300 150V200H0Z" fill="#3B2A5C"/><path d="M34 172V120h10v-14l8 10 8-10v14h10v52Z" fill="#1C1233"/><rect x="48" y="134" width="8" height="12" fill="#FFD166"/>${pumpkin(250, 176, 14)}${pumpkin(120, 184, 10)}`;
    case "autumn": return `<rect width="300" height="200" fill="#FCE3B5"/><circle cx="60" cy="50" r="24" fill="#FFF3D6"/><path d="M0 168Q90 138 170 160T300 150V200H0Z" fill="#C98A4B"/>${[[50, 150, "#E4572E"], [120, 140, "#F2B134"], [230, 142, "#C8553D"], [275, 152, "#F2B134"]].map(([x, y, c]) => `<rect x="${Number(x) - 4}" y="${Number(y) - 6}" width="8" height="34" fill="#8A5A3C"/><circle cx="${x}" cy="${Number(y) - 26}" r="26" fill="${c}"/>`).join("")}${dots([[90, 80], [160, 60], [200, 100], [30, 110], [260, 70]], "#E4572E", 3)}`;
    case "newyear": return `<rect width="300" height="200" fill="#1F3A5F"/>${dots([[20, 20], [60, 70], [100, 30], [140, 90], [200, 40], [250, 80], [280, 30], [40, 120], [180, 120]], "#FFFFFF", 1.8)}<path d="M0 166Q100 146 180 160T300 152V200H0Z" fill="#F4F8FB"/>${fir(226, 168, 30, "#2F8F5B")}<path d="M226 96l3 7 7 .6-5.400 4.600 1.700 7-6.300-3.800-6.300 3.800 1.700-7-5.400-4.600 7-.6z" fill="#FFD166"/>${dots([[216, 130], [238, 140], [224, 152], [208, 160], [244, 160]], "#E63950", 3)}<rect x="60" y="158" width="30" height="24" fill="#D93B3B"/><rect x="72" y="158" width="6" height="24" fill="#FFD166"/><rect x="96" y="166" width="22" height="18" fill="#3FA796"/><rect x="105" y="166" width="4" height="18" fill="#FFFFFF"/>`;
    default: return `<rect width="300" height="200" fill="#BFE3F2"/><circle cx="56" cy="46" r="22" fill="#FFFFFF" opacity=".8"/>${dots([[100, 30], [150, 70], [200, 30], [250, 90], [280, 40], [30, 100], [180, 110], [120, 100]], "#FFFFFF", 2.4)}<path d="M0 160Q70 120 150 150T300 140V200H0Z" fill="#E3F1F8"/><path d="M0 176Q110 150 190 168T300 160V200H0Z" fill="#F4F8FB"/>${fir(40, 168, 18, "#3F8F7A")}${fir(262, 160, 22, "#3F8F7A")}${fir(236, 166, 14, "#56A68F")}`;
  }
}
