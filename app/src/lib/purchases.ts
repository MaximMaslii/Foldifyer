// RevenueCat wrapper. appUserID = our anonymous deviceId, so the backend can check the subscription.
import { Platform } from "react-native";
import Purchases, { type PurchasesPackage } from "react-native-purchases";

const KEY = Platform.select({ ios: process.env.EXPO_PUBLIC_RC_IOS_KEY, android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY }) || "";
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

export type Offer = { pack3: PurchasesPackage | null; pack10: PurchasesPackage | null; month: PurchasesPackage | null; year: PurchasesPackage | null };
/** The current RevenueCat offering: the Club (monthly and annual, entitlement "club") and two one-time packs (foldifyer_pack3, foldifyer_pack10). */
export async function offers(): Promise<Offer> {
  if (!configured) return { pack3: null, pack10: null, month: null, year: null };
  const cur = (await Purchases.getOfferings()).current;
  const by = (id: string) => cur?.availablePackages.find((p) => p.product.identifier.startsWith(id)) ?? null;
  return { pack3: by("foldifyer_pack3"), pack10: by("foldifyer_pack10"), month: cur?.monthly ?? by("foldifyer_club_month"), year: cur?.annual ?? by("foldifyer_club_year") };
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
