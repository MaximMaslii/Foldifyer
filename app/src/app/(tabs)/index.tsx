import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useI18n } from "@/i18n";
import { useSession } from "@/lib/session";
import { F, R, S, useColors } from "@/lib/theme";
import { H1, SectionTitle } from "@/components/ui";
import { FigView } from "@/components/FigView";
import { Steps } from "@/components/Steps";
import { SvgView } from "@/components/SvgView";
import { currentCollection, sceneArt } from "@/lib/club";
import { UnlockCard } from "@/components/UnlockCard";
import type { Kind } from "@/lib/types";

export default function Make() {
  const c = useColors();
  const { t } = useI18n();
  const { me, figs } = useSession();
  const col = currentCollection();
  // Example photos: the small picture in the corner is the photo, the big one is the finished paper toy.
  const EXAMPLE = { pet: require("../../../assets/example-pet.jpg"), person: require("../../../assets/example-person.jpg") };
  const Choice = ({ kind, title, sub }: { kind: Kind; title: string; sub: string }) => (
    <Pressable onPress={() => router.push({ pathname: "/new", params: { kind } })} accessibilityRole="button" accessibilityLabel={title}
      style={({ pressed }) => ({ flex: 1, backgroundColor: c.card, borderRadius: R.xl, borderWidth: 2, borderColor: c.line, padding: 6, paddingBottom: S.md, alignItems: "center", gap: 4, opacity: pressed ? 0.8 : 1 })}>
      <Image source={EXAMPLE[kind]} style={{ width: "100%", aspectRatio: 0.6, borderRadius: R.lg }} contentFit="cover" accessibilityIgnoresInvertColors />
      <Text style={{ color: c.ink, fontSize: F.lg, fontWeight: "800", textAlign: "center" }}>{title}</Text>
      <Text style={{ color: c.muted, fontSize: F.xs, textAlign: "center", lineHeight: 16 }}>{sub}</Text>
      <View style={{ marginTop: 6, width: 40, height: 40, borderRadius: 20, backgroundColor: c.primary, alignItems: "center", justifyContent: "center" }}><Ionicons name="camera" size={20} color={c.onPrimary} /></View>
    </Pressable>
  );
  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: S.xl, gap: S.lg }}>
        <H1>{t("homeTitle")}</H1>
        <View style={{ flexDirection: "row", gap: S.md }}>
          <Choice kind="pet" title={t("pet")} sub={t("petSub")} />
          <Choice kind="person" title={t("person")} sub={t("personSub")} />
        </View>
        <UnlockCard />
        <Pressable onPress={() => router.push("/club")} accessibilityRole="button" accessibilityLabel={t("colMonth")} style={({ pressed }) => ({ borderRadius: R.xl, overflow: "hidden", backgroundColor: c.card, borderWidth: 2, borderColor: c.line, opacity: pressed ? 0.85 : 1 })}>
          <View style={{ height: 120 }}>
            <SvgView xml={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 20 300 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">${sceneArt(col.id)}</svg>`} style={{ flex: 1 }} />
            {figs[0] ? <View style={{ position: "absolute", right: S.lg, bottom: 0 }}><FigView fig={{ ...figs[0], outfit: col.outfits[0] }} style={{ width: 84, height: 104 }} /></View> : null}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: S.md, padding: S.lg }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.muted, fontSize: F.xs, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" }}>{t("colMonth")}</Text>
              <Text style={{ color: c.ink, fontSize: F.xl, fontWeight: "800" }}>{t(`c_${col.id}`)}</Text>
              <Text style={{ color: c.accent, fontWeight: "800", fontSize: F.sm }}>{t("colSee")}</Text>
            </View>
            <Ionicons name={me?.club ? "chevron-forward" : "lock-closed"} size={20} color={c.accent} />
          </View>
        </Pressable>
        <SectionTitle>{t("howTitle")}</SectionTitle>
        <Steps />
      </ScrollView>
    </SafeAreaView>
  );
}
