import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useI18n, usePaperWords } from "@/i18n";
import { drawOpts, useSession } from "@/lib/session";
import { buildSteps } from "@/lib/paper";
import { F, R, S, useColors } from "@/lib/theme";
import { Back, Btn, P, SectionTitle } from "@/components/ui";
import { FigView } from "@/components/FigView";
import { SvgView } from "@/components/SvgView";

/** Building the printed figure one part at a time: which part to cut, and where it goes on the figure. */
export default function Build() {
  const c = useColors();
  const { t } = useI18n();
  const words = usePaperWords();
  const { id } = useLocalSearchParams<{ id: string }>();
  const fig = useSession().figs.find((f) => f.id === id);
  const steps = useMemo(() => (fig ? buildSteps(fig, drawOpts(), words) : []), [fig, words]);
  const [k, setK] = useState(0);
  if (!fig) return <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: c.bg, padding: S.xl }}><Back label={t("back")} /></SafeAreaView>;
  const done = k >= steps.length, st = steps[Math.min(k, steps.length - 1)];
  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: S.xl, paddingTop: S.sm, gap: S.md }}>
        <Back label={t("back")} />
        <View style={{ flexDirection: "row", gap: 4 }} accessibilityLabel={t("stepOf", { a: Math.min(k + 1, steps.length), b: steps.length })}>
          {steps.map((_s, i) => <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i < k || done ? c.primary : i === k ? c.accent : c.line }} />)}
        </View>
        {done ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: S.md }}>
            <FigView fig={fig} style={{ width: "100%", height: 240, marginTop: S.xl, overflow: "hidden" }} />
            <Ionicons name="checkmark-circle" size={44} color={c.primary} />
            <Text style={{ color: c.ink, fontSize: F.xl, fontWeight: "800", textAlign: "center" }}>{t("buildDone")}</Text>
            <P style={{ textAlign: "center" }}>{t("buildDoneSub")}</P>
          </View>
        ) : (
          <>
            <Text style={{ color: c.muted, fontSize: F.sm, fontWeight: "700" }}>{t("stepOf", { a: k + 1, b: steps.length })}</Text>
            <Text style={{ color: c.ink, fontSize: F.xl, fontWeight: "800" }}>{st.count > 1 ? t("buildCutN", { name: st.label, n: st.count }) : t("buildCut", { name: st.label })}</Text>
            <SectionTitle>{t("buildNet")}</SectionTitle>
            <View style={{ backgroundColor: "#FFFFFF", borderRadius: R.lg, borderWidth: 1, borderColor: c.line, padding: S.md }}>
              <SvgView xml={st.net} style={{ width: "100%", height: 170 }} />
            </View>
            <SectionTitle>{t("buildPlace")}</SectionTitle>
            <View style={{ backgroundColor: c.card2, borderRadius: R.lg, padding: S.sm }}>
              <SvgView xml={st.done} style={{ width: "100%", height: 220 }} />
            </View>
            <View style={{ flexDirection: "row", gap: S.md, alignItems: "center" }}>
              <Ionicons name="bulb-outline" size={20} color={c.accent} />
              <Text style={{ flex: 1, color: c.ink, fontSize: F.sm, lineHeight: 20 }}>{t("buildTip")}</Text>
            </View>
          </>
        )}
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: "row", gap: S.md }}>
          {k > 0 ? <Btn label={t("prev")} kind="ghost" onPress={() => setK((v) => v - 1)} style={{ flex: 1 }} /> : null}
          {done
            ? <Btn label={t("share")} icon="share-social-outline" onPress={() => router.replace({ pathname: "/share/[id]", params: { id: fig.id } })} style={{ flex: 1 }} />
            : <Btn label={k === steps.length - 1 ? t("done") : t("next")} onPress={() => setK((v) => v + 1)} style={{ flex: 1 }} />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
