// No-server demo (EXPO_PUBLIC_DEMO=1): the same API surface as api.ts, answered on the device with drawn sample figures.
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Fig, Kind, Level, Me, Outfit, Sticker } from "./types";
import { ApiError } from "./errors";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
type State = { figs: Fig[]; used: number; credits: number; club: boolean; clubUsed: number; seq: number };
const state: State = { figs: [], used: 0, credits: 0, club: false, clubUsed: 0, seq: 0 };
const KEY = "pp_demo_state";
const loaded: Promise<void> = AsyncStorage.getItem(KEY).then((v) => { if (v) Object.assign(state, JSON.parse(v) as State); }).catch(() => {});
const save = () => { AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {}); };
const me = (): Me => ({ deviceId: "demo-device", plus: false, club: state.club, clubLeft: 0, credits: state.credits, freeLeft: Math.max(0, 2 - state.used) });
const PETS = ["cat", "dog", "greycat"], PEOPLE = ["girl", "boy"];
const find = (id: string) => { const f = state.figs.find((x) => x.id === id); if (!f) throw new ApiError(404, "not_found"); return f; };

export const demoApi = {
  me: async () => { await loaded; return me(); },
  syncCredits: async () => me(),
  /** Stands in for a purchase in the demo. */
  grant: (what: "pack5" | "pack10") => { state.club = true; state.credits += what === "pack5" ? 5 : 10; save(); },
  createFig: async (body: { photo: string; kind: Kind; name: string }) => {
    await loaded;
    let free = false;
    { if (state.used < 2) { state.used++; free = true; } else if (state.credits > 0) state.credits--; else throw new ApiError(402, "paywall"); }
    const list = body.kind === "pet" ? PETS : PEOPLE, n = state.figs.filter((f) => f.kind === body.kind).length;
    const fig: Fig = { id: `d${++state.seq}`, createdAt: new Date().toISOString(), status: "generating", kind: body.kind, name: body.name, preset: list[n % list.length], outfit: "none", level: "normal", free };
    state.figs.unshift(fig); save();
    setTimeout(() => { fig.status = "ready"; save(); }, 2600);
    return { id: fig.id };
  },
  figs: async () => { await loaded; return { figs: state.figs.filter((f) => f.status === "ready") }; },
  fig: async (id: string) => { await loaded; await wait(300); return { fig: { ...find(id) } }; },
  figUpdate: async (id: string, body: { name?: string; outfit?: Outfit; level?: Level; stickers?: Sticker[] }) => { const f = find(id); Object.assign(f, body); save(); return { fig: { ...f } }; },
  figReport: async () => ({ ok: true }),
  figDelete: async (id: string) => { state.figs = state.figs.filter((f) => f.id !== id); save(); return { ok: true }; },
  deleteData: async () => { state.figs = []; save(); return { ok: true }; },
};
