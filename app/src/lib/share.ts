// Web / fallback version: a browser cannot hand a picture of a view to other apps the way a phone can.
import type { RefObject } from "react";
import type { View } from "react-native";

/** Returns false when a picture cannot be shared on this platform. */
export async function shareView(_ref: RefObject<View | null>, text: string): Promise<boolean> {
  const nav = globalThis.navigator as (Navigator & { share?: (d: { text: string }) => Promise<void> }) | undefined;
  if (!nav?.share) return false;
  try { await nav.share({ text }); } catch { /* closed by the person */ }
  return true;
}
