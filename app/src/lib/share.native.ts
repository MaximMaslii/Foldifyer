// Phone version: takes a picture of the given view and opens the system share menu with it.
import type { RefObject } from "react";
import type { View } from "react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";

export async function shareView(ref: RefObject<View | null>, text: string): Promise<boolean> {
  if (!ref.current || !(await Sharing.isAvailableAsync())) return false;
  const uri = await captureRef(ref, { format: "jpg", quality: 0.92, result: "tmpfile" });
  await Sharing.shareAsync(uri, { mimeType: "image/jpeg", dialogTitle: text, UTI: "public.jpeg" });
  return true;
}
