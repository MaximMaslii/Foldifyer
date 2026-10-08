import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useI18n, usePaperWords } from "@/i18n";
import { useSession } from "@/lib/session";
import { COLLECTIONS, clubOutfitArt, currentCollection, sceneArt, type Collection } from "@/lib/club";
import { sceneSheet, stickerArt } from "@/lib/paper";
import { F, R, S, useColors } from "@/lib/theme";
import { Back, Btn, Grid, H1, P, SectionTitle } from "@/components/ui";
import { SvgView } from "@/components/SvgView";
import { PrintBar } from "@/components/PrintBar";
import type { Strings } from "@/i18n/strings";

const box = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%"><rect width="100" height="100" rx="14" fill="#F6E3C5"/>${inner}</svg>`;

/** The collection of the month, and the earlier ones below it. */
export default function Club() {
  const c = useColors();
  const { t } = useI18n();
  const words = usePaperWords();
  const { me, figs, paper } = useSession();
  const now = currentCollection(), rest = COLLECTIONS.filter((x) => x.id !== now.id);
  const Item = ({ label, xml }: { label: string; xml: string }) => (
    <View style={{ alignItems: "center", backgroundColor: c.card, borderRadius: R.lg, borderWidth: 2, borderColor: c.line, padding: 6, gap: 2 }}>
      <SvgView xml={xml} style={{ width: 64, height: 64 }} />
      <Text numberOfLines={2} style={{ color: c.ink, fontSize: 11, fontWeight: "700", textAlign: "center", minHeight: 28 }}>{label}</Text>
    </View>
  );
  const Block = ({ col, big }: { col: Collection; big?: boolean }) => (
    <View style={{ gap: S.md }}>
      <View style={{ borderRadius: R.xl, overflow: "hidden", height: big ? 190 : 110 }}>
        <SvgView xml={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">${sceneArt(col.id)}</svg>`} style={{ flex: 1 }} />
        <View style={{ position: "absolute", left: S.lg, bottom: S.md, backgroundColor: "#FFF8EE", borderRadius: R.sm, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ color: "#2B2118", fontWeight: "800", fontSize: big ? F.lg : F.sm }}>{t(`c_${col.id}`)}</Text>
        </View>
      </View>
      <SectionTitle>{t("colOutfits")}</SectionTitle>
      <Grid min={76} gap={S.sm}>{col.outfits.map((o) => <Item key={o} label={t(`o_${o}` as keyof Strings)} xml={box(clubOutfitArt(o, false))} />)}</Grid>
      <SectionTitle>{t("colStickers")}</SectionTitle>
      <Grid min={76} gap={S.sm}>{col.stickers.map((k) => <Item key={k} label={t(`s_${k}` as keyof Strings)} xml={box(stickerArt(k, false))} />)}</Grid>
      {big ? (
        <>
          <SectionTitle>{t("colScene")}</SectionTitle>
          <P>{t("colSceneSub")}</P>
          {me?.club ? <PrintBar sheets={() => [sceneSheet(col.id, t(`c_${col.id}`), paper, words)]} /> : null}
        </>
      ) : null}
    </View>
  );
  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: S.xl, paddingTop: S.sm, gap: S.lg }}>
        <Back label={t("back")} />
        <H1>{t("colMonth")}</H1>
        <Block col={now} big />
        {me?.club
          ? (figs.length ? <Btn label={t("colTry")} icon="shirt-outline" onPress={() => router.push({ pathname: "/fig/[id]", params: { id: figs[0].id } })} /> : null)
          : (
            <Pressable onPress={() => router.push("/packs")} accessibilityRole="button" style={{ flexDirection: "row", alignItems: "center", gap: S.md, backgroundColor: c.card2, borderRadius: R.lg, padding: S.lg }}>
              <Ionicons name="lock-closed" size={22} color={c.accent} />
              <View style={{ flex: 1 }}><Text style={{ color: c.ink, fontWeight: "800", fontSize: F.md }}>{t("clubOpen")}</Text><Text style={{ color: c.muted, fontSize: F.sm }}>{t("clubTag")}</Text></View>
              <Ionicons name="chevron-forward" size={18} color={c.muted} />
            </Pressable>
          )}
        <Text style={{ color: c.ink, fontSize: F.xl, fontWeight: "800", marginTop: S.md }}>{t("colAll")}</Text>
        {rest.map((col) => <Block key={col.id} col={col} />)}
      </ScrollView>
    </SafeAreaView>
  );
}
