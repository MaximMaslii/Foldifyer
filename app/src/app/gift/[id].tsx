import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useI18n, usePaperWords } from "@/i18n";
import { drawOpts, useSession } from "@/lib/session";
import { cardSheet, giftBoxSheet, PAGE } from "@/lib/paper";
import { S, useColors } from "@/lib/theme";
import { Back, Btn, Chip, Field, Grid, H1, P, SectionTitle, Segmented } from "@/components/ui";
import { SvgView } from "@/components/SvgView";
import { PrintBar } from "@/components/PrintBar";

const CAPS = ["cap1", "cap2", "cap3", "cap4", "cap5"] as const;

/** A card or a little gift box with the figure on it. */
export default function Gift() {
  const c = useColors();
  const { t } = useI18n();
  const words = usePaperWords();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { figs, paper, me } = useSession();
  const fig = figs.find((f) => f.id === id);
  const [what, setWhat] = useState<"card" | "box">("card");
  const [cap, setCap] = useState<(typeof CAPS)[number] | "own">("cap1");
  const [own, setOwn] = useState("");
  const caption = cap === "own" ? own.trim() : t(cap);
  const sheets = useMemo(() => (!fig ? [] : what === "card" ? [cardSheet(fig, caption, paper, drawOpts(), words)] : giftBoxSheet(fig, caption, paper, drawOpts(), words)), [fig, what, caption, paper, words]);
  if (!fig) return <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: c.bg, padding: S.xl }}><Back label={t("back")} /></SafeAreaView>;
  const [pw, ph] = PAGE[paper];
  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: S.xl, paddingTop: S.sm, gap: S.lg }} keyboardShouldPersistTaps="handled">
        <Back label={t("back")} />
        <H1>{t("giftTitle")}</H1>
        <Segmented<"card" | "box"> value={what} onChange={setWhat} options={[{ v: "card", label: t("giftCard") }, { v: "box", label: t("giftBox") }]} />
        <P>{t(what === "card" ? "giftCardSub" : "giftBoxSub")}</P>
        <SectionTitle>{t("captionTitle")}</SectionTitle>
        <Grid min={140} gap={S.sm}>
          {CAPS.map((k) => <Chip key={k} label={t(k)} on={cap === k} onPress={() => setCap(k)} />)}
          <Chip label={t("captionOwn")} on={cap === "own"} onPress={() => setCap("own")} />
        </Grid>
        {cap === "own" ? <Field label={t("captionOwn")} value={own} onChangeText={setOwn} maxLength={40} autoFocus /> : null}
        <View style={{ alignItems: "center" }}>
          <SvgView xml={sheets[0]} style={{ width: 240, height: (240 * ph) / pw, borderRadius: 6, overflow: "hidden", borderWidth: 1, borderColor: c.line, backgroundColor: "#fff" }} />
        </View>
        {what === "box" && !me?.club ? <><Btn label={t("clubOpen")} icon="lock-open-outline" onPress={() => router.push("/packs")} /><P style={{ textAlign: "center" }}>{t("clubNeeded")}</P></> : <PrintBar sheets={() => sheets} />}
      </ScrollView>
    </SafeAreaView>
  );
}
