import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useI18n } from "@/i18n";
import { F, S, useColors } from "@/lib/theme";

/** The whole app in three steps. */
export function Steps() {
  const c = useColors();
  const { t } = useI18n();
  const rows: [keyof typeof Ionicons.glyphMap, "step1" | "step2" | "step3", "step1s" | "step2s" | "step3s"][] = [["camera-outline", "step1", "step1s"], ["print-outline", "step2", "step2s"], ["cut-outline", "step3", "step3s"]];
  return (
    <View style={{ gap: S.md }}>
      {rows.map(([icon, a, b], k) => (
        <View key={a} style={{ flexDirection: "row", gap: S.md, alignItems: "center" }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.card2, alignItems: "center", justifyContent: "center" }}><Ionicons name={icon} size={22} color={c.accent} /></View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.ink, fontSize: F.md, fontWeight: "800" }}>{k + 1}. {t(a)}</Text>
            <Text style={{ color: c.muted, fontSize: F.sm, lineHeight: 19 }}>{t(b)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
