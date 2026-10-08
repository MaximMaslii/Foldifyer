export type Lang = "en" | "ru" | "de";
export type Kind = "pet" | "person";
export const LEVELS = ["easy", "normal", "hard"] as const;
export type Level = (typeof LEVELS)[number];
export const OUTFITS = ["none", "santa", "pumpkin", "heart", "party", "bunny", "crown"] as const;
/** One of OUTFITS (free), or a Club outfit from lib/club.ts. */
export type Outfit = string;
export const STICKERS = ["glasses", "shades", "moustache", "bow", "tie", "flower", "star", "blush", "patch"] as const;
/** One of STICKERS, or a Club sticker from lib/club.ts. All stickers belong to the Club. */
export type Sticker = string;
export type Colors = { fur: string; fur2: string; inner: string; skin: string; hair: string; top: string; bottom: string; shoes: string };

export type Fig = {
  id: string; createdAt: string; status: "generating" | "ready" | "failed"; reason?: string;
  kind: Kind; name: string;
  /** id of the generated picture with four tiles (face, side, fur/hair, chest) */
  atlas?: string;
  /** a drawn sample instead of a generated picture (demo) */
  preset?: string;
  colors?: Colors; outfit: Outfit; level: Level; free: boolean; stickers?: Sticker[];
};
/** `club`: the subscription is active; `clubLeft`: Club figures left this month. */
export type Me = { deviceId: string; plus: boolean; club: boolean; clubLeft: number; credits: number; freeLeft: number };

export type Paper = "a4" | "letter";
