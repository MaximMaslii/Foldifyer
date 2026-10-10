// RevenueCat wrapper. appUserID = our anonymous deviceId, so the backend can check the subscription.
import { Platform } from "react-native";
import Purchases, { type PurchasesPackage } from "react-native-purchases";

const RAW = Platform.select({ ios: process.env.EXPO_PUBLIC_RC_IOS_KEY, android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY }) || "";
/** A placeholder left in eas.json ("..._PASTE_...") counts as no key: purchases stay off instead of failing. */
const KEY = RAW.includes("PASTE") ? "" : RAW;
let configured = false;

export function configurePurchases(deviceId: string) {
  if (configured || !KEY) return;
  try {
    Purchases.configure({ apiKey: KEY, appUserID: deviceId });
    configured = true;
  } catch (e) {
    console.warn("RevenueCat not available in this build", e);
  }
}

export const purchasesReady = () => configured;

export type Offer = { pack5: PurchasesPackage | null; pack10: PurchasesPackage | null };
/** How many figures a store product gives: com.foldifyer.5pics → 5, com.foldifyer.10pics → 10 (also foldifyer_pack5 / _pack10). */
const size = (id: string) => Number(/(\d+)\s*pics|pack(\d+)/i.exec(id)?.slice(1).find(Boolean) ?? 0);
/** The current RevenueCat offering: two one-time packs (consumables com.foldifyer.5pics and com.foldifyer.10pics). Any pack unlocks everything. */
export async function offers(): Promise<Offer> {
  if (!configured) return { pack5: null, pack10: null };
  // Looks in every offering (the current one first), so the two packs can sit in one offering or in two separate ones.
  const all = await Purchases.getOfferings();
  const pkgs = [...(all.current?.availablePackages ?? []), ...Object.values(all.all).flatMap((o) => o.availablePackages)];
  const by = (n: number) => pkgs.find((p) => size(p.product.identifier) === n) ?? null;
  return { pack5: by(5), pack10: by(10) };
}

/** true when the purchase went through (the server then counts packs and checks Plus). */
export async function buy(pkg: PurchasesPackage): Promise<boolean> {
  try { await Purchases.purchasePackage(pkg); return true; }
  catch (e: unknown) { if ((e as { userCancelled?: boolean }).userCancelled) return false; throw e; }
}

export async function restore(): Promise<void> {
  if (configured) await Purchases.restorePurchases();
}

export async function managementUrl(): Promise<string | null> {
  if (!configured) return null;
  return (await Purchases.getCustomerInfo()).managementURL;
}
