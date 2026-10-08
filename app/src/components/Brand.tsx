import { View } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** The logo strip at the top of every screen. Its colours are fixed, so the dark lettering stays readable in the dark theme too. */
export function Brand() {
  const top = useSafeAreaInsets().top;
  return (
    <View style={{ paddingTop: top + 6, paddingBottom: 8, paddingHorizontal: 20, backgroundColor: "#FFF8EE", borderBottomWidth: 1, borderBottomColor: "#EBDCC6", flexDirection: "row", alignItems: "center", gap: 10 }} accessibilityRole="header" accessibilityLabel="Foldifyer">
      <Image source={require("../../assets/logo.png")} style={{ width: 34, height: 34, borderRadius: 8 }} contentFit="cover" />
      <Image source={require("../../assets/wordmark.png")} style={{ width: 123, height: 30 }} contentFit="contain" />
    </View>
  );
}
