export type Lang = "en" | "ru" | "de";
export const KINDS = ["pet", "person"] as const;
export type Kind = (typeof KINDS)[number];
export const LEVELS = ["easy", "normal", "hard"] as const;
/** Free outfits, then the Club's monthly collections (the app's lib/club.ts has the same ids). */
export const FREE_OUTFITS = ["none", "santa", "pumpkin", "heart", "party", "bunny", "crown"];
export const OUTFITS = [...FREE_OUTFITS, "witch", "ghost", "candy", "beanie", "leafcrown", "mug", "antlers", "elf", "gift", "earmuffs", "snowman", "icecrown"];
/** Stickers are part of the Club. */
export const STICKERS = ["glasses", "shades", "moustache", "bow", "tie", "flower", "star", "blush", "patch", "fangs", "stitches", "web", "freckles", "monocle", "leaf", "rednose", "snowflake", "holly", "goggles", "frost", "snowstar"];

/** Flat colours the app paints the plain sides with (#RRGGBB). Pets use fur/fur2/inner, people skin/hair/top/bottom/shoes. */
export type Colors = { fur: string; fur2: string; inner: string; skin: string; hair: string; top: string; bottom: string; shoes: string };

export type FigDoc = {
  _id: string;
  deviceId: string;
  createdAt: Date;
  status: "generating" | "ready" | "failed";
  kind: Kind;
  name: string;
  /** id of the stored 3×3 picture of printed surfaces (see ai.ts) */
  atlas?: string;
  /** set instead of atlas when the server runs without an AI key (the app draws a sample) */
  preset?: string;
  colors?: Colors;
  outfit: string;
  /** face stickers (Club) */
  stickers?: string[];
  level: (typeof LEVELS)[number];
  /** made with the free figure: the printed sheet carries the app's name */
  free: boolean;
  /** why it failed, for the app to explain */
  reason?: string;
};
export type FigDTO = Omit<FigDoc, "_id" | "deviceId" | "createdAt"> & { id: string; createdAt: string };

export type DeviceDoc = {
  _id: string;
  createdAt: Date;
  lastSeenAt: Date;
  /** free figures used */
  used: number;
  /** paid figures left */
  credits: number;
  /** Club figures used in the calendar month `clubMonth` ("2026-10") */
  clubMonth?: string;
  clubUsed?: number;
  /** store purchases already turned into credits */
  rcSeen: string[];
};

export type ImageDoc = { _id: string; deviceId: string; createdAt: Date; r2?: boolean; fileId?: import("mongodb").ObjectId; type: string };
