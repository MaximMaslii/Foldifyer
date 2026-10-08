import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { Fig, Kind, Level, Me, Outfit, Sticker } from "./types";
import { ApiError } from "./errors";
import { demoApi } from "./demoApi";
export { ApiError };

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080").replace(/\/$/, "");
const TOKEN_KEY = "pp_token";
const DEVICE_KEY = "pp_device";

// Keychain on phones; AsyncStorage fallback on web previews.
const store = {
  get: (k: string) => (Platform.OS === "web" ? AsyncStorage.getItem(k) : SecureStore.getItemAsync(k)),
  set: (k: string, v: string) => (Platform.OS === "web" ? AsyncStorage.setItem(k, v) : SecureStore.setItemAsync(k, v)),
  del: (k: string) => (Platform.OS === "web" ? AsyncStorage.removeItem(k) : SecureStore.deleteItemAsync(k)),
};

let token: string | null = null;
let deviceId: string | null = null;

/** EXPO_PUBLIC_DEMO=1 → no server: drawn sample figures instead of generated pictures. */
export const DEMO = process.env.EXPO_PUBLIC_DEMO === "1";

/** No sign-up: the first launch gets an anonymous device id + token and keeps it in the keychain. */
export async function ensureDevice(): Promise<string> {
  if (DEMO) return "demo-device";
  if (deviceId && token) return deviceId;
  token = await store.get(TOKEN_KEY);
  deviceId = await store.get(DEVICE_KEY);
  if (token && deviceId) return deviceId;
  const res = await fetch(`${API_URL}/v1/device`, { method: "POST" });
  if (!res.ok) throw new ApiError(res.status, "device_failed");
  const data = (await res.json()) as { deviceId: string; token: string };
  token = data.token;
  deviceId = data.deviceId;
  await store.set(TOKEN_KEY, token);
  await store.set(DEVICE_KEY, deviceId);
  return deviceId;
}

async function call<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  await ensureDevice();
  const res = await fetch(`${API_URL}${path}`, {
    method: init.method ?? (init.body ? "POST" : "GET"),
    headers: { Authorization: `Bearer ${token}`, ...(init.body ? { "Content-Type": "application/json" } : {}) },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
  if (res.status === 401) {
    // Token lost on the server (e.g. DB reset) — start a fresh anonymous device.
    await store.del(TOKEN_KEY);
    await store.del(DEVICE_KEY);
    token = deviceId = null;
  }
  if (!res.ok) throw new ApiError(res.status, data.error ?? "error", data.message);
  return data as T;
}

/** Where the Privacy Policy, Terms and data-deletion pages live. */
export const LEGAL_URL = (process.env.EXPO_PUBLIC_LEGAL_URL || `${API_URL}/legal`).replace(/\/$/, "");
export const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL || "";

/** Address of a stored picture. */
export const imgUrl = (id: string) => `${API_URL}/v1/img/${id}`;

const realApi = {
  me: (fresh = false) => call<Me>(`/v1/me${fresh ? "?fresh=1" : ""}`),
  syncCredits: () => call<Me>("/v1/credits/sync", { body: {} }),
  createFig: (body: { photo: string; kind: Kind; name: string }) => call<{ id: string }>("/v1/figs", { body }),
  figs: () => call<{ figs: Fig[] }>("/v1/figs"),
  fig: (id: string) => call<{ fig: Fig }>(`/v1/figs/${id}`),
  figUpdate: (id: string, body: { name?: string; outfit?: Outfit; level?: Level; stickers?: Sticker[] }) => call<{ fig: Fig }>(`/v1/figs/${id}`, { method: "PUT", body }),
  figReport: (id: string) => call<{ ok: boolean }>(`/v1/figs/${id}/report`, { body: {} }),
  figDelete: (id: string) => call<{ ok: boolean }>(`/v1/figs/${id}`, { method: "DELETE" }),
  deleteData: () => call<{ ok: boolean }>("/v1/data", { method: "DELETE" }),
};

export const api = DEMO ? (demoApi as unknown as typeof realApi) : realApi;
