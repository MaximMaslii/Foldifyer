import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useI18n } from "@/i18n";
import { useSession } from "@/lib/session";
import { api, DEMO } from "@/lib/api";
import { demoApi } from "@/lib/demoApi";
import { buy, offers, restore, type Offer } from "@/lib/purchases";
import { currentCollection, sceneArt } from "@/lib/club";
import { F, R, S, useColors } from "@/lib/theme";
import { Btn, H1, P, SectionTitle } from "@/components/ui";
import { SvgView } from "@/components/SvgView";

type Id = "year" | "month" | "pack3" | "pack10";
const CLUB_FIGS = 5;

/** The paywall: the Club (a new collection every month) on top, plain packs of figures below. */
export default function Packs() {
  const c = useColors();
  const { t } = useI18n();
  const { setMe, refreshMe, me } = useSession();
  const [of, setOf] = useState<Offer>({ pack3: null, pack10: null, month: null, year: null });
  const [choice, setChoice] = useState<Id>(me?.club ? "pack10" : "year");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { offers().then(setOf).catch(() => {}); }, []);
  const close = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)"));
  const col = currentCollection();

  async function purchase() {
    setBusy(true); setMsg(null);
    try {
      if (DEMO) { demoApi.grant(choice); await refreshMe(); close(); return; }
      const pkg = of[choice];
      if (!pkg) { setMsg(t("payNotReady")); return; }
      if (!(await buy(pkg))) return;
      // The server asks the store what was bought; it can take a few seconds to show up there.
      for (let k = 0; k < 5; k++) {
        const m = await api.syncCredits().catch(() => null);
        if (m) { setMe(m); if (m.club || m.credits > 0) break; }
        await new Promise((r) => setTimeout(r, 1500));
      }
      close();
    } catch { setMsg(t("somethingWrong")); }
    finally { setBusy(false); }
  }
  async function onRestore() {
    setBusy(true); setMsg(null);
    try { await restore(); const m = await api.syncCredits(); setMe(m); setMsg(m.club || m.credits > 0 ? t("purchased") : t("nothingToRestore")); }
    catch { setMsg(t("somethingWrong")); }
    finally { setBusy(false); }
  }

  // Prices come from the store in the buyer's currency; these numbers are only the fallback.
  const price = (id: Id, fb: string) => of[id]?.product.priceString ?? fb;
  const yNum = of.year?.product.price ?? 24.99, mNum = of.month?.product.price ?? 3.99;
  const save = Math.round((1 - yNum / (mNum * 12)) * 100);
  const yearPerMonth = price("year", "$24.99").replace(/[\d.,]+/, (yNum / 12).toFixed(2));
  const Plan = ({ id, title, sub, right, badge }: { id: Id; title: string; sub?: string; right: string; badge?: string }) => {
    const on = choice === id;
    return (
      <Pressable onPress={() => setChoice(id)} accessibilityRole="radio" accessibilityState={{ checked: on }}
        style={{ flexDirection: "row", alignItems: "center", gap: S.md, paddingHorizontal: S.lg, paddingVertical: S.md, minHeight: 60, borderRadius: R.lg, borderWidth: 2.5, borderColor: on ? c.primary : c.line, backgroundColor: on ? c.card2 : c.card }}>
        <Ionicons name={on ? "radio-button-on" : "radio-button-off"} size={24} color={on ? c.primary : c.muted} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: S.sm, flexWrap: "wrap" }}>
            <Text style={{ color: c.ink, fontWeight: "800", fontSize: F.md }}>{title}</Text>
            {badge ? <Text style={{ backgroundColor: c.primary, color: c.onPrimary, fontWeight: "800", fontSize: F.xs, paddingHorizontal: 8, paddingVertical: 2, borderRadius: R.sm, overflow: "hidden" }}>{badge}</Text> : null}
          </View>
          {sub ? <Text style={{ color: c.muted, fontSize: F.sm }}>{sub}</Text> : null}
        </View>
        <Text style={{ color: c.ink, fontWeight: "800", fontSize: F.md }}>{right}</Text>
      </Pressable>
    );
  };
  const isClub = choice === "year" || choice === "month";
  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: S.xl, paddingTop: S.sm, gap: S.md }}>
        <Pressable onPress={close} hitSlop={10} style={{ alignSelf: "flex-end", minHeight: 44, minWidth: 44, alignItems: "flex-end", justifyContent: "center" }} accessibilityRole="button" accessibilityLabel={t("close")}>
          <Ionicons name="close" size={28} color={c.ink} />
        </Pressable>
        {me?.club ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: S.md, backgroundColor: c.good, borderRadius: R.lg, padding: S.lg }}>
            <Ionicons name="checkmark-circle" size={24} color={c.onTone} />
            <View style={{ flex: 1 }}><Text style={{ color: c.onTone, fontWeight: "800", fontSize: F.md }}>{t("clubOn")}</Text><Text style={{ color: c.onTone, fontSize: F.sm }}>{t("clubLeft", { n: me.clubLeft })}</Text></View>
          </View>
        ) : (
          <>
            <View style={{ borderRadius: R.xl, overflow: "hidden", height: 120 }}>
              <SvgView xml={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 20 300 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">${sceneArt(col.id)}</svg>`} style={{ flex: 1 }} />
              <View style={{ position: "absolute", left: S.lg, bottom: S.md, backgroundColor: "#FFF8EE", borderRadius: R.sm, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: "#2B2118", fontWeight: "800", fontSize: F.sm }}>{t("colMonth")}: {t(`c_${col.id}`)}</Text>
              </View>
            </View>
            <H1>{t("clubName")}</H1>
            <View style={{ gap: S.sm }}>
              {(["clubB1", "clubB2", "clubB3", "clubB4"] as const).map((k) => (
                <View key={k} style={{ flexDirection: "row", alignItems: "flex-start", gap: S.md }}>
                  <Ionicons name="checkmark-circle" size={22} color={c.primary} />
                  <Text style={{ flex: 1, color: c.ink, fontSize: F.md, fontWeight: "600", lineHeight: 22 }}>{t(k, { n: CLUB_FIGS })}</Text>
                </View>
              ))}
            </View>
            <Plan id="year" title={t("planYear")} sub={t("perMonthOnly", { price: yearPerMonth })} right={t("perYear", { price: price("year", "$24.99") })} badge={save > 0 ? t("saveBadge", { n: save }) : undefined} />
            <Plan id="month" title={t("planMonth")} right={t("perMonth", { price: price("month", "$3.99") })} />
          </>
        )}
        <SectionTitle>{t(me?.club ? "packsTitle" : "orOnce")}</SectionTitle>
        <Plan id="pack3" title={t("pack3")} right={price("pack3", "$2.99")} />
        <Plan id="pack10" title={t("pack10")} right={price("pack10", "$6.99")} />
        <View style={{ flex: 1 }} />
        <Btn label={isClub ? t("clubOpen") : t("buy")} onPress={purchase} loading={busy} />
        {msg ? <Text style={{ color: c.muted, textAlign: "center" }}>{msg}</Text> : null}
        <P style={{ textAlign: "center", fontSize: F.xs }}>{isClub ? t("clubFine") : t("onceFine")}{DEMO ? ` ${t("demoPay")}` : ""}</P>
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", columnGap: S.xl, rowGap: S.sm }}>
          {DEMO ? null : <Pressable onPress={onRestore} hitSlop={10}><Text style={{ color: c.muted, fontWeight: "700" }}>{t("restore")}</Text></Pressable>}
          <Pressable onPress={() => router.push({ pathname: "/legal", params: { doc: "terms" } })} hitSlop={10} accessibilityRole="link"><Text style={{ color: c.muted, fontWeight: "700" }}>{t("termsFull")}</Text></Pressable>
          <Pressable onPress={() => router.push({ pathname: "/legal", params: { doc: "privacy" } })} hitSlop={10} accessibilityRole="link"><Text style={{ color: c.muted, fontWeight: "700" }}>{t("privacyFull")}</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
