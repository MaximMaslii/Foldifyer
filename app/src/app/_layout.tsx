import { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { I18nProvider } from "@/i18n";
import { SessionProvider, useSession } from "@/lib/session";
import { useColors, useIsDark } from "@/lib/theme";
import { MAX_W } from "@/components/ui";
import { Brand } from "@/components/Brand";

SplashScreen.preventAutoHideAsync().catch(() => {});

function Nav() {
  const c = useColors();
  const dark = useIsDark();
  const { booted } = useSession();
  useEffect(() => { if (booted) SplashScreen.hideAsync().catch(() => {}); }, [booted]);
  return (
    <>
      <StatusBar style={dark ? "light" : "dark"} />
      <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center" }}>
        <View style={{ flex: 1, width: "100%", maxWidth: MAX_W }}>
          <Brand />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: "slide_from_right" }}>
            <Stack.Screen name="packs" options={{ animation: "slide_from_bottom" }} />
          </Stack>
        </View>
      </View>
    </>
  );
}

export default function RootLayout() {
  return <SafeAreaProvider><I18nProvider><SessionProvider><Nav /></SessionProvider></I18nProvider></SafeAreaProvider>;
}
