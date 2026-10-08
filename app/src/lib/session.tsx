import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import { api, ensureDevice, imgUrl } from "./api";
import { configurePurchases } from "./purchases";
import type { Fig, Kind, Level, Me, Outfit, Paper, Sticker } from "./types";
import type { Opts } from "./paper";

type Ctx = {
  booted: boolean; bootError: boolean; retryBoot: () => void;
  me: Me | null; refreshMe: () => Promise<Me>; setMe: (m: Me) => void;
  figs: Fig[]; putFig: (f: Fig) => void; dropFig: (id: string) => void;
  /** Sends the photo and starts drawing; returns the figure id to wait for. */
  create: (photo: string, kind: Kind, name: string) => Promise<string>;
  change: (id: string, body: { name?: string; outfit?: Outfit; level?: Level; stickers?: Sticker[] }) => void;
  /** First launch: the welcome screen has been seen. */
  seen: boolean; setSeen: () => void;
  paper: Paper; setPaper: (p: Paper) => void;
  wipe: () => Promise<void>;
};
const SessionCtx = createContext<Ctx | null>(null);
/** How the paper engine finds a figure's picture. */
export const drawOpts = (line = false): Opts => ({ line, img: imgUrl });

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [booted, setBooted] = useState(false);
  const [bootError, setBootError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [me, setMe] = useState<Me | null>(null);
  const [figs, setFigs] = useState<Fig[]>([]);
  const [seen, setSeenState] = useState(false);
  // Letter in the US and Canada, A4 everywhere else; can be changed in More.
  const [paper, setPaperState] = useState<Paper>(() => (["US", "CA"].includes(getLocales()[0]?.regionCode ?? "") ? "letter" : "a4"));

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        setBootError(false);
        const [id, s, p] = await Promise.all([ensureDevice(), AsyncStorage.getItem("pp_seen").catch(() => null), AsyncStorage.getItem("pp_paper").catch(() => null)]);
        configurePurchases(id);
        if (dead) return;
        setSeenState(s === "1");
        if (p === "a4" || p === "letter") setPaperState(p);
        const [m, list] = await Promise.all([api.me(), api.figs()]);
        if (dead) return;
        setMe(m); setFigs(list.figs);
      } catch { if (!dead) setBootError(true); }
      finally { if (!dead) setBooted(true); }
    })();
    return () => { dead = true; };
  }, [attempt]);

  const refreshMe = useCallback(async () => { const m = await api.me(); setMe(m); return m; }, []);
  const putFig = useCallback((f: Fig) => setFigs((cur) => (cur.some((x) => x.id === f.id) ? cur.map((x) => (x.id === f.id ? f : x)) : [f, ...cur])), []);
  const dropFig = useCallback((id: string) => setFigs((cur) => cur.filter((x) => x.id !== id)), []);
  const create = useCallback(async (photo: string, kind: Kind, name: string) => { const { id } = await api.createFig({ photo, kind, name }); api.me().then(setMe).catch(() => {}); return id; }, []);
  const change = useCallback((id: string, body: { name?: string; outfit?: Outfit; level?: Level; stickers?: Sticker[] }) => {
    setFigs((cur) => cur.map((x) => (x.id === id ? { ...x, ...body } : x))); // shown at once; the server just remembers it
    api.figUpdate(id, body).catch(() => {});
  }, []);
  const setSeen = useCallback(() => { setSeenState(true); AsyncStorage.setItem("pp_seen", "1").catch(() => {}); }, []);
  const setPaper = useCallback((p: Paper) => { setPaperState(p); AsyncStorage.setItem("pp_paper", p).catch(() => {}); }, []);
  const wipe = useCallback(async () => { await api.deleteData(); setFigs([]); setMe(await api.me()); }, []);

  const value = useMemo<Ctx>(() => ({ booted, bootError, retryBoot: () => { setBooted(false); setAttempt((a) => a + 1); }, me, refreshMe, setMe, figs, putFig, dropFig, create, change, seen, setSeen, paper, setPaper, wipe }),
    [booted, bootError, me, refreshMe, figs, putFig, dropFig, create, change, seen, setSeen, paper, setPaper, wipe]);
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useSession() {
  const c = useContext(SessionCtx);
  if (!c) throw new Error("SessionProvider missing");
  return c;
}
