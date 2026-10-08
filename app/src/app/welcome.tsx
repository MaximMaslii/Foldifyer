import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useI18n } from "@/i18n";
import { useSession } from "@/lib/session";
import { F, R, S, useColors } from "@/lib/theme";
import { Btn, P, Segmented } from "@/components/ui";
import { FigView, sample } from "@/components/FigView";
import { Steps } from "@/components/Steps";
import type { Lang } from "@/lib/types";

export default function Welcome() {
  const c = useColors();
  const { t, lang, setLang } = useI18n();
  const { setSeen } = useSession();
  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: S.xl, gap: S.lg }}>
        <View style={{ flexDirection: "row", justifyContent: "center", backgroundColor: c.card2, borderRadius: R.xl, paddingTop: S.md }}>
          <FigView fig={sample("cat", "pet", "party")} style={{ width: 120, height: 160 }} />
          <FigView fig={sample("girl", "person")} style={{ width: 110, height: 160 }} />
          <FigView fig={sample("dog", "pet")} style={{ width: 120, height: 160 }} />
        </View>
        <Text style={{ fontSize: 26, fontWeight: "800", color: c.ink, lineHeight: 32 }}>{t("welcomeTitle")}</Text>
        <Steps />
        <View style={{ flex: 1 }} />
        <Segmented<Lang> value={lang} onChange={setLang} options={[{ v: "en", label: "English" }, { v: "ru", label: "Русский" }, { v: "de", label: "Deutsch" }]} />
        <View style={{ gap: 4 }}>
          <P style={{ fontSize: 12, lineHeight: 17 }}>{t("agreeLine")}</P>
          <View style={{ flexDirection: "row", gap: S.xl }}>
            <Pressable onPress={() => router.push({ pathname: "/legal", params: { doc: "terms" } })} hitSlop={10} accessibilityRole="link"><Text style={{ color: c.accent, fontWeight: "700", fontSize: 13 }}>{t("termsFull")}</Text></Pressable>
            <Pressable onPress={() => router.push({ pathname: "/legal", params: { doc: "privacy" } })} hitSlop={10} accessibilityRole="link"><Text style={{ color: c.accent, fontWeight: "700", fontSize: 13 }}>{t("privacyFull")}</Text></Pressable>
          </View>
        </View>
        <Btn label={t("welcomeCta")} onPress={() => { setSeen(); router.replace("/(tabs)"); }} />
      </ScrollView>
    </SafeAreaView>
  );
}
