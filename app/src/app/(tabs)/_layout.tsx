import type { ColorValue } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useI18n } from "@/i18n";
import { useColors } from "@/lib/theme";

export default function TabsLayout() {
  const c = useColors();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const icon = (name: keyof typeof Ionicons.glyphMap) => ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} color={color as string} size={size} />;
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: c.accent, tabBarInactiveTintColor: c.muted, tabBarStyle: { backgroundColor: c.card, borderTopColor: c.line, height: 68 + insets.bottom, paddingTop: 4, paddingBottom: insets.bottom + 6 }, tabBarLabelStyle: { fontSize: 12, fontWeight: "700" }, sceneStyle: { backgroundColor: c.bg } }}>
      <Tabs.Screen name="index" options={{ title: t("tabMake"), tabBarIcon: icon("add-circle-outline") }} />
      <Tabs.Screen name="shelf" options={{ title: t("tabShelf"), tabBarIcon: icon("albums-outline") }} />
      <Tabs.Screen name="more" options={{ title: t("tabMore"), tabBarIcon: icon("ellipsis-horizontal-circle-outline") }} />
    </Tabs>
  );
}
