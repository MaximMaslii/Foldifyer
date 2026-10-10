import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useI18n } from "@/i18n";
import { useSession } from "@/lib/session";
import { offers } from "@/lib/purchases";
import { F, R, S, useColors } from "@/lib/theme";
import { FigView, sample } from "./FigView";

/** Home screen: how many figures are left, and the way to the paywall (packs that also unlock every outfit and bonus). */
export function UnlockCard() {
  const c = useColors();
  const { t } = useI18n();
  const { me } = useSession();
  const [p, setP] = useState({ p5: "$2.99", p10: "$4.99" });
  useEffect(() => {
    offers().then((o) => setP({ p5: o.pack5?.product.priceString ?? "$2.99", p10: o.pack10?.product.priceString ?? "$4.99" })).catch(() => {});
  }, []);
  if (!me) return null;
  const left = me.freeLeft + me.credits;

  // Already unlocked (any pack bought): a calm card with the figures left.
  if (me.club || me.plus) {
    return (
      <Pressable onPress={() => router.push("/packs")} accessibilityRole="button"
        style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: S.md, backgroundColor: c.good, borderRadius: R.lg, padding: S.lg, opacity: pressed ? 0.85 : 1 })}>
        <Ionicons name="checkmark-circle" size={26} color={c.onTone} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.onTone, fontWeight: "800", fontSize: F.md }}>{t("unlockedTitle")}</Text>
          <Text style={{ color: c.onTone, fontSize: F.sm }}>{me.plus ? "∞" : t("unlockedSub", { n: left })}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.onTone} />
      </Pressable>
    );
  }

  return (
    <Pressable onPress={() => router.push("/packs")} accessibilityRole="button" accessibilityLabel={`${t("unlockTitle")}. ${t("unlockSub", p)}`}
      style={({ pressed }) => ({ borderRadius: R.xl, backgroundColor: c.primary, overflow: "hidden", opacity: pressed ? 0.9 : 1 })}>
      {/* soft paper circles in the background */}
      <View style={{ position: "absolute", right: -30, top: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: "#FFFFFF22" }} />
      <View style={{ position: "absolute", left: -20, bottom: -50, width: 110, height: 110, borderRadius: 55, backgroundColor: "#FFFFFF18" }} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: S.md, padding: S.lg, paddingRight: 0 }}>
        <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: "#FFF8EE", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: c.accent, fontSize: F.xl, fontWeight: "900", lineHeight: 24 }}>{left}</Text>
          <Text style={{ color: c.accent, fontSize: 10, fontWeight: "800" }} numberOfLines={1}>{t("unlockFree")}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: "#FFFFFF", fontWeight: "900", fontSize: F.lg, lineHeight: 22 }}>{t("unlockTitle")}</Text>
          <Text style={{ color: "#FFFFFF", opacity: 0.95, fontWeight: "700", fontSize: F.sm }}>{t("unlockSub", p)}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4, alignSelf: "flex-start", backgroundColor: "#FFF8EE", borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Ionicons name="lock-open" size={13} color={c.accent} />
            <Text style={{ color: c.accent, fontWeight: "800", fontSize: F.xs }}>{t("clubOpen")}</Text>
          </View>
        </View>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 84, alignItems: "center" }}>
          <FigView fig={sample("cat", "pet", "crown")} style={{ width: 80, height: 98 }} />
        </View>
      </View>
    </Pressable>
  );
}
