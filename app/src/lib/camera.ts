// Take or pick a photo and shrink it for the AI (faster upload, cheaper to read).
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

export type Shot = { uri: string; base64: string };

/** null = cancelled; throws "denied" when the camera permission is refused. */
export async function takeShot(camera: boolean, width = 1024): Promise<Shot | null> {
  if (camera) {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new Error("denied");
  }
  const res = camera
    ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.85 })
    : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
  if (res.canceled || !res.assets[0]) return null;
  const ctx = ImageManipulator.manipulate(res.assets[0].uri);
  ctx.resize({ width });
  const img = await ctx.renderAsync();
  const out = await img.saveAsync({ format: SaveFormat.JPEG, compress: 0.75, base64: true });
  const base64 = out.base64 ?? "";
  return { uri: base64 ? `data:image/jpeg;base64,${base64}` : out.uri, base64 };
}
