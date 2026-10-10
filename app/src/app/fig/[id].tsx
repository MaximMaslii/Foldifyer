import { useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useI18n, usePaperWords } from "@/i18n";
import { drawOpts, useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { figureSheets, figureSpin, PAGE, partCount, stickerArt } from "@/lib/paper";
import { Spin } from "@/components/Spin";
import { Ionicons } from "@expo/vector-icons";
import { F, R, S, useColors } from "@/lib/theme";
import { Back, Btn, Card, Field, Grid, P, SectionTitle, Segmented } from "@/components/ui";
import { FigView } from "@/components/FigView";
import { SvgView } from "@/components/SvgView";
import { PrintBar } from "@/components/PrintBar";
import { LEVELS, OUTFITS, STICKERS, type Level, type Sticker } from "@/lib/types";
import { CLUB_OUTFITS, CLUB_STICKERS, currentCollection } from "@/lib/club";
import type { Strings } from "@/i18n/strings";

export default function FigScreen() {
  const c = useColors();
  const { t } = useI18n();
  const words = usePaperWords();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { figs, change, dropFig, paper, me } = useSession();
  const fig = figs.find((f) => f.id === id);
  const [line, setLine] = useState(false);
  const [reported, setReported] = useState(false);
  const spin = useMemo(() => (yaw: number) => (fig ? figureSpin(fig, yaw, drawOpts(line)) : ""), [fig, line]);
  const sheets = useMemo(() => (fig ? figureSheets({ ...fig, free: fig.free && !me?.club }, paper, drawOpts(line), words) : []), [fig, paper, line, words, me?.club]);
  if (!fig) return <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: c.bg, padding: S.xl }}><Back label={t("back")} /></SafeAreaView>;

  const del = async () => { await api.figDelete(fig.id).catch(() => {}); dropFig(fig.id); router.replace("/(tabs)/shelf"); };
  function askDel() {
    if (Platform.OS === "web") { if (globalThis.confirm?.(t("deleteFigAsk"))) void del(); return; }
    Alert.alert(t("deleteFig"), t("deleteFigAsk"), [{ text: t("cancel"), style: "cancel" }, { text: t("delete"), style: "destructive", onPress: () => void del() }]);
  }
  // This month's collection first, so there is always something new at the top.
  const col = currentCollection(), byNew = (list: string[], now: string[]) => [...now, ...list.filter((k) => !now.includes(k))];
  const outfits = [OUTFITS[0], ...byNew(CLUB_OUTFITS, col.outfits), ...OUTFITS.slice(1)], stickers = [...byNew(CLUB_STICKERS, col.stickers), ...STICKERS];
  const n = partCount(fig), [pw, ph] = PAGE[paper];
  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: S.xl, paddingTop: S.sm, gap: S.lg }} keyboardShouldPersistTaps="handled">
        <Back label={t("back")} />
        <View style={{ backgroundColor: line ? "#FFFFFF" : c.card2, borderRadius: R.xl, alignItems: "center", paddingTop: S.md }}>
          <Spin make={spin} hint={t("spinHint")} style={{ width: "100%", height: 300 }} />
          {fig.name ? <Text style={{ color: line ? "#2B2118" : c.ink, fontSize: F.xl, fontWeight: "800", paddingBottom: S.md }}>{fig.name}</Text> : null}
        </View>

        <PrintBar sheets={() => sheets} />
        <Btn label={t("buildBtn")} icon="construct-outline" kind="ghost" onPress={() => router.push({ pathname: "/build/[id]", params: { id: fig.id } })} />
        <View style={{ flexDirection: "row", gap: S.md }}>
          <Btn label={t("share")} icon="share-social-outline" kind="ghost" onPress={() => router.push({ pathname: "/share/[id]", params: { id: fig.id } })} style={{ flex: 1 }} />
          <Btn label={t("gift")} icon="gift-outline" kind="ghost" onPress={() => router.push({ pathname: "/gift/[id]", params: { id: fig.id } })} style={{ flex: 1 }} />
        </View>

        <SectionTitle>{t("outfitTitle")}</SectionTitle>
        <Grid min={76} gap={S.sm}>
          {outfits.map((o) => {
            const on = fig.outfit === o, locked = o !== "none" && !me?.club, fresh = col.outfits.includes(o);
            return (
              <Pressable key={o} onPress={() => (locked ? router.push("/packs") : change(fig.id, { outfit: o }))} accessibilityRole="radio" accessibilityState={{ checked: on, disabled: locked }} accessibilityLabel={t(`o_${o}` as keyof Strings)}
                style={{ alignItems: "center", backgroundColor: c.card, borderRadius: R.lg, borderWidth: 2.5, borderColor: on ? c.primary : c.line, padding: 6, gap: 2 }}>
                <View style={{ alignSelf: "stretch", opacity: locked ? 0.45 : 1 }}><FigView fig={{ ...fig, outfit: o, level: "easy" }} style={{ width: "100%", height: 84 }} /></View>
                {locked ? <View style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: c.primary, alignItems: "center", justifyContent: "center" }}><Ionicons name="lock-closed" size={12} color={c.onPrimary} /></View> : null}
                {fresh ? <View style={{ position: "absolute", top: 4, left: 4, backgroundColor: c.accent, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 }}><Text style={{ color: "#fff", fontSize: 9, fontWeight: "800" }}>NEW</Text></View> : null}
                <Text numberOfLines={2} style={{ color: locked ? c.muted : c.ink, fontSize: 11, fontWeight: "700", textAlign: "center", minHeight: 28 }}>{t(`o_${o}` as keyof Strings)}</Text>
              </Pressable>
            );
          })}
        </Grid>

        <View style={{ flexDirection: "row", alignItems: "center", gap: S.sm }}>
          <SectionTitle>{t("stickersTitle")}</SectionTitle>
          {me?.club ? null : <Ionicons name="lock-closed" size={14} color={c.accent} />}
        </View>
        <Grid min={76} gap={S.sm}>
          {stickers.map((k) => {
            const on = (fig.stickers ?? []).includes(k);
            const toggle = () => { if (!me?.club) { router.push("/packs"); return; } const cur: Sticker[] = fig.stickers ?? []; change(fig.id, { stickers: on ? cur.filter((x) => x !== k) : [...cur, k] }); };
            return (
              <Pressable key={k} onPress={toggle} accessibilityRole="checkbox" accessibilityState={{ checked: on, disabled: !me?.club }} accessibilityLabel={t(`s_${k}` as keyof Strings)}
                style={{ alignItems: "center", backgroundColor: c.card, borderRadius: R.lg, borderWidth: 2.5, borderColor: on ? c.primary : c.line, padding: 6, gap: 2 }}>
                <View style={{ opacity: me?.club ? 1 : 0.4 }}>
                  <SvgView xml={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%"><rect width="100" height="100" rx="14" fill="#F6E3C5"/>${stickerArt(k, fig.kind === "pet")}</svg>`} style={{ width: 56, height: 56 }} />
                </View>
                {me?.club ? null : <View style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: c.primary, alignItems: "center", justifyContent: "center" }}><Ionicons name="lock-closed" size={12} color={c.onPrimary} /></View>}
                <Text numberOfLines={2} style={{ color: me?.club ? c.ink : c.muted, fontSize: 11, fontWeight: "700", textAlign: "center", minHeight: 28 }}>{t(`s_${k}` as keyof Strings)}</Text>
              </Pressable>
            );
          })}
        </Grid>
        {me?.club ? null : <P>{t("clubNeeded")}</P>}

        <SectionTitle>{t("levelTitle")}</SectionTitle>
        <Segmented<Level> value={fig.level} onChange={(level) => change(fig.id, { level })} options={LEVELS.map((v) => ({ v, label: t(`l_${v}`) }))} />
        <P>{t(`l_${fig.level}Sub`)} {sheets.length === 1 ? t("sheets1", { p: n }) : t("sheetsN", { p: n, s: sheets.length })}</P>

        <SectionTitle>{t("colorTitle")}</SectionTitle>
        <Segmented<"full" | "line"> value={line ? "line" : "full"} onChange={(v) => setLine(v === "line")} options={[{ v: "full", label: t("colorFull") }, { v: "line", label: t("colorLine") }]} />
        {line ? <P>{t("colorLineSub")}</P> : null}

        <SectionTitle>{t("sheetsTitle")}</SectionTitle>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: S.md }}>
          {sheets.map((s, k) => <SvgView key={k} xml={s} style={{ width: 200, height: (200 * ph) / pw, borderRadius: 6, overflow: "hidden", borderWidth: 1, borderColor: c.line, backgroundColor: "#fff" }} />)}
        </ScrollView>
        {fig.free && !me?.club ? <P>{t("freeMark")}</P> : null}

        <Card>
          <Text style={{ color: c.ink, fontSize: F.lg, fontWeight: "800" }}>{t("howBuild")}</Text>
          {(["b1", "b2", "b3", fig.kind === "person" ? "b4p" : "b4", "b5"] as const).map((k, i) => (
            <View key={k} style={{ flexDirection: "row", gap: S.md }}>
              <Text style={{ color: c.accent, fontWeight: "800", fontSize: F.md, width: 18 }}>{i + 1}</Text>
              <Text style={{ flex: 1, color: c.ink, fontSize: F.sm, lineHeight: 20 }}>{t(k)}</Text>
            </View>
          ))}
        </Card>

        <Field label={t("rename")} value={fig.name} onChangeText={(name) => change(fig.id, { name: name.slice(0, 24) })} maxLength={24} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: S.md }}>
          {fig.atlas ? <Pressable hitSlop={10} disabled={reported} onPress={() => { api.figReport(fig.id).catch(() => {}); setReported(true); }}><Text style={{ color: c.muted, fontWeight: "700" }}>{reported ? t("reported") : t("report")}</Text></Pressable> : <View />}
          <Pressable hitSlop={10} onPress={askDel}><Text style={{ color: c.danger, fontWeight: "700" }}>{t("deleteFig")}</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
