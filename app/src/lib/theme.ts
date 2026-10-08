import { useSyncExternalStore } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Foldifyer palette: warm paper, a friendly orange for the one main button on each screen.
const light = {
  bg: "#FFF8EE", card: "#FFFFFF", card2: "#FCEBD3", ink: "#2B2118", muted: "#7A6A58", line: "#EBDCC6",
  primary: "#F28C28", onPrimary: "#FFFFFF", accent: "#D9701A", good: "#D8EDC8", warn: "#FFE2B8", onTone: "#2B2118", shelf: "#D9A066", danger: "#B4372F",
};
const dark: typeof light = {
  bg: "#1B1611", card: "#27201A", card2: "#342A20", ink: "#F6EDE0", muted: "#B9A994", line: "#42362A",
  primary: "#F28C28", onPrimary: "#1B1611", accent: "#FFB066", good: "#3F5A34", warn: "#6A4A1C", onTone: "#F6EDE0", shelf: "#7A5632", danger: "#FF8A7A",
};
export type Colors = typeof light;

export type ThemeMode = "system" | "light" | "dark";
// Light unless the person picks something else in More: the warm paper look is the app's face.
let mode: ThemeMode = "light";
const listeners = new Set<() => void>();
AsyncStorage.getItem("pp_theme").then((v) => { if (v === "light" || v === "dark" || v === "system") { mode = v; listeners.forEach((l) => l()); } }).catch(() => {});
export function setThemeMode(m: ThemeMode) { mode = m; AsyncStorage.setItem("pp_theme", m).catch(() => {}); listeners.forEach((l) => l()); }
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const useThemeMode = () => useSyncExternalStore(subscribe, () => mode, () => mode);
export function useIsDark() { const system = useColorScheme(); const m = useThemeMode(); return m === "system" ? system === "dark" : m === "dark"; }
export function useColors(): Colors { return useIsDark() ? dark : light; }

export const R = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };
export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const F = { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, xxl: 28, hero: 34 };
