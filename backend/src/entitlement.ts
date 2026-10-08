// What did this device buy? Asked from RevenueCat (the app's appUserID = our deviceId).
import { env } from "./env.js";

const cache = new Map<string, { at: number; club: boolean }>();
/** Is the Club subscription active for this device? */
export async function isClub(deviceId: string, fresh = false): Promise<boolean> {
  if (env.devAllPro) return true;
  if (!env.revenuecatSecret) return false;
  const hit = cache.get(deviceId);
  if (!fresh && hit && Date.now() - hit.at < 60_000) return hit.club;
  try {
    const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(deviceId)}`, { headers: { Authorization: `Bearer ${env.revenuecatSecret}`, Accept: "application/json" }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`revenuecat ${res.status}`);
    const body = (await res.json()) as { subscriber?: { entitlements?: Record<string, { expires_date: string | null }> } };
    const ent = body.subscriber?.entitlements?.[env.clubEntitlement];
    const club = !!ent && (ent.expires_date === null || new Date(ent.expires_date).getTime() > Date.now());
    cache.set(deviceId, { at: Date.now(), club });
    return club;
  } catch (e) { console.error("club check failed", (e as Error).message); return hit?.club ?? false; }
}

/** One-time packs bought in the store → [transaction id, product id] pairs. */
export async function packPurchases(deviceId: string): Promise<[string, string][]> {
  if (!env.revenuecatSecret) return [];
  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(deviceId)}`, {
    headers: { Authorization: `Bearer ${env.revenuecatSecret}`, Accept: "application/json" }, signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`revenuecat ${res.status}`);
  const body = (await res.json()) as { subscriber?: { non_subscriptions?: Record<string, { id: string }[]> } };
  const out: [string, string][] = [];
  for (const [product, list] of Object.entries(body.subscriber?.non_subscriptions ?? {})) for (const t of list) out.push([t.id, product]);
  return out;
}
