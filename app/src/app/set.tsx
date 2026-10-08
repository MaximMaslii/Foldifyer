import { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useI18n, usePaperWords } from "@/i18n";
import { drawOpts, useSession } from "@/lib/session";
import { figureSheets, houseSheet } from "@/lib/paper";
import { F, R, S, useColors } from "@/lib/theme";
import { Back, Grid, H1, P, Segmented } from "@/components/ui";
import { FigView } from "@/components/FigView";
import { PrintBar } from "@/components/PrintBar";
import { Image } from "expo-image";
import { shareView } from "@/lib/share";
import { Btn } from "@/components/ui";

/** Several figures in one print: the whole family, me and my dog, each with a little house if wanted. */
export default function SetScreen() {
  const c = useColors();
  const { t } = useI18n();
  const words = usePaperWords();
  const { figs, paper, me } = useSession();
  const [picked, setPicked] = useState<string[]>(() => figs.slice(0, 4).map((f) => f.id));
  const [house, setHouse] = useState(false);
  const [line, setLine] = useState(false);
  const sheets = useMemo(() => figs.filter((f) => picked.includes(f.id)).flatMap((f) => [...figureSheets({ ...f, free: f.free && !me?.club }, paper, drawOpts(line), words), ...(house ? houseSheet(f.name || "♥", f.kind === "pet", paper, drawOpts(line), words) : [])]), [figs, picked, house, line, paper, words, me?.club]);
  const card = useRef<View>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const chosen = figs.filter((f) => picked.includes(f.id));
  async function share() {
    setBusy(true); setMsg(null);
    try { if (!(await shareView(card, t("shareText", { name: chosen.map((f) => f.name).filter(Boolean).join(", ") || t("shareNoName") })))) setMsg(t("shareNo")); }
    catch { setMsg(t("somethingWrong")); }
    finally { setBusy(false); }
  }
  const toggle = (id: string) => setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: S.xl, paddingTop: S.sm, gap: S.lg }}>
        <Back label={t("back")} />
        <H1>{t("setTitle")}</H1>
        <P>{t("setSub")}</P>
        <Grid min={100}>
          {figs.map((f) => {
            const on = picked.includes(f.id);
            return (
              <Pressable key={f.id} onPress={() => toggle(f.id)} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={f.name}
                style={{ backgroundColor: c.card, borderRadius: R.lg, borderWidth: 2.5, borderColor: on ? c.primary : c.line, padding: S.sm, alignItems: "center" }}>
                <FigView fig={f} line={line} style={{ width: "100%", height: 110 }} />
                <Text numberOfLines={1} style={{ color: c.ink, fontWeight: "700", fontSize: F.sm, minHeight: 20 }}>{f.name}</Text>
                <View style={{ position: "absolute", top: 6, right: 6 }}><Ionicons name={on ? "checkmark-circle" : "ellipse-outline"} size={24} color={on ? c.primary : c.muted} /></View>
              </Pressable>
            );
          })}
        </Grid>
        <Pressable onPress={() => (me?.club ? setHouse((v) => !v) : router.push("/packs"))} accessibilityRole="checkbox" accessibilityState={{ checked: house }} style={{ flexDirection: "row", gap: S.md, alignItems: "center", backgroundColor: c.card, borderRadius: R.lg, padding: S.lg }}>
          <Ionicons name={house ? "checkbox" : "square-outline"} size={26} color={house ? c.accent : c.muted} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.ink, fontWeight: "700", fontSize: F.md }}>{t("setHouse")}</Text>
            <Text style={{ color: c.muted, fontSize: F.sm, lineHeight: 19 }}>{t("setHouseSub")}</Text>
          </View>
          <Ionicons name={me?.club ? "home-outline" : "lock-closed"} size={22} color={c.accent} />
        </Pressable>
        <Segmented<"full" | "line"> value={line ? "line" : "full"} onChange={(v) => setLine(v === "line")} options={[{ v: "full", label: t("colorFull") }, { v: "line", label: t("colorLine") }]} />
        <Text style={{ color: c.ink, fontWeight: "700", textAlign: "center" }}>{sheets.length ? t("setCount", { n: sheets.length }) : t("setEmpty")}</Text>
        <PrintBar sheets={() => sheets} disabled={!sheets.length} />
        {chosen.length ? (
          <>
            {/* The picture that gets shared: everyone ticked, standing together. Fixed light colours so it looks the same in the dark theme. */}
            <View ref={card} collapsable={false} style={{ backgroundColor: "#FFE9C7", borderRadius: R.xl, overflow: "hidden" }}>
              <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "flex-end", padding: S.md }}>
                {chosen.map((f) => (
                  <View key={f.id} style={{ width: chosen.length > 4 ? "25%" : `${100 / chosen.length}%`, maxWidth: 150, alignItems: "center" }}>
                    <FigView fig={f} style={{ width: "100%", height: chosen.length > 2 ? 110 : 170 }} />
                    <Text numberOfLines={1} style={{ color: "#2B2118", fontWeight: "800", fontSize: F.sm }}>{f.name}</Text>
                  </View>
                ))}
              </View>
              <View style={{ alignItems: "flex-end", padding: S.md, backgroundColor: "#FFF8EE" }}>
                <Image source={require("../../assets/wordmark.png")} style={{ width: 98, height: 24 }} contentFit="contain" />
              </View>
            </View>
            <Btn label={t("shareBtn")} icon="share-social-outline" kind="ghost" onPress={share} loading={busy} />
            {msg ? <P style={{ textAlign: "center" }}>{msg}</P> : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
