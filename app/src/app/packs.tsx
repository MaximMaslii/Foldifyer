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
import { F, R, S, useColors } from "@/lib/theme";
import { Btn, P } from "@/components/ui";
import { FigView, sample } from "@/components/FigView";

type Id = "pack5" | "pack10";
const COUNT: Record<Id, number> = { pack5: 5, pack10: 10 };
/** Fallback prices; the store's own prices (in the buyer's currency) replace them. */
const FALLBACK: Record<Id, number> = { pack5: 2.99, pack10: 4.99 };

/** The paywall: two one-time packs of figures. Any pack also unlocks every outfit, sticker, gift box, house and scene for good. */
export default function Packs() {
  const c = useColors();
  const { t } = useI18n();
  const { setMe, refreshMe, me } = useSession();
  const [of, setOf] = useState<Offer>({ pack5: null, pack10: null });
  const [choice, setChoice] = useState<Id>("pack10");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { offers().then(setOf).catch(() => {}); }, []);
  const close = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)"));

  async function purchase() {
    setBusy(true); setMsg(null);
    try {
      if (DEMO) { demoApi.grant(choice); await refreshMe(); close(); return; }
      const pkg = of[choice];
      if (!pkg) { setMsg(t("payNotReady")); return; }
      if (!(await buy(pkg))) return;
      // The server asks the store what was bought; it can take a few seconds to show up there.
      const before = me?.credits ?? 0;
      for (let k = 0; k < 6; k++) {
        const m = await api.syncCredits().catch(() => null);
        if (m) { setMe(m); if (m.credits > before) break; }
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

  const num = (id: Id) => of[id]?.product.price ?? FALLBACK[id];
  const price = (id: Id) => of[id]?.product.priceString ?? `$${FALLBACK[id]}`;
  const perFig = (id: Id) => price(id).replace(/[\d.,]+/, (num(id) / COUNT[id]).toFixed(2));

  const Plan = ({ id }: { id: Id }) => {
    const on = choice === id, best = id === "pack10";
    return (
      <Pressable onPress={() => setChoice(id)} accessibilityRole="radio" accessibilityState={{ checked: on }}
        style={{ flex: 1, alignItems: "center", gap: 2, paddingVertical: S.lg, paddingHorizontal: S.sm, borderRadius: R.lg, borderWidth: 2.5, borderColor: on ? c.primary : c.line, backgroundColor: on ? c.card2 : c.card }}>
        {best ? (
          <View style={{ position: "absolute", top: -12, backgroundColor: c.primary, borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 3 }}>
            <Text style={{ color: c.onPrimary, fontWeight: "800", fontSize: F.xs }}>{t("bestValue")}</Text>
          </View>
        ) : null}
        <Text style={{ color: c.ink, fontSize: 40, fontWeight: "900", lineHeight: 46 }}>{COUNT[id]}</Text>
        <Text style={{ color: c.muted, fontWeight: "700", fontSize: F.sm }}>{t(id === "pack5" ? "pack5" : "pack10").replace(/^\d+\s*/, "")}</Text>
        <Text style={{ color: c.ink, fontWeight: "900", fontSize: F.xl, marginTop: S.sm }}>{price(id)}</Text>
        <Text style={{ color: c.muted, fontSize: F.xs }}>{t("perFig", { price: perFig(id) })}</Text>
        <Ionicons name={on ? "radio-button-on" : "radio-button-off"} size={22} color={on ? c.primary : c.muted} style={{ marginTop: S.sm }} />
      </Pressable>
    );
  };
  const benefits: [keyof typeof Ionicons.glyphMap, string][] = [
    ["camera", t("payB1")], ["shirt", t("payB2")], ["happy", t("payB3")], ["gift", t("payB4")], ["sparkles", t("payB5")], ["print", t("payB6")],
  ];

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: S.xl, paddingTop: S.sm, gap: S.lg }}>
        <Pressable onPress={close} hitSlop={10} style={{ alignSelf: "flex-end", minHeight: 44, minWidth: 44, alignItems: "flex-end", justifyContent: "center" }} accessibilityRole="button" accessibilityLabel={t("close")}>
          <Ionicons name="close" size={28} color={c.ink} />
        </Pressable>

        <View style={{ backgroundColor: c.card2, borderRadius: R.xl, paddingTop: S.lg, alignItems: "center", overflow: "hidden" }}>
          <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 2 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <FigView fig={sample("cat", "pet", "santa")} style={{ width: 86, height: 106 }} />
            <FigView fig={sample("girl", "person", "crown")} style={{ width: 100, height: 124 }} />
            <FigView fig={sample("dog", "pet", "party")} style={{ width: 86, height: 106 }} />
          </View>
        </View>

        <View style={{ gap: 4 }}>
          <Text style={{ color: c.ink, fontSize: F.xxl, fontWeight: "900", textAlign: "center" }} accessibilityRole="header">{t("payTitle")}</Text>
          <P style={{ textAlign: "center" }}>{t("paySub")}</P>
        </View>

        {me?.club ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: S.md, backgroundColor: c.good, borderRadius: R.lg, padding: S.md }}>
            <Ionicons name="checkmark-circle" size={22} color={c.onTone} />
            <Text style={{ flex: 1, color: c.onTone, fontWeight: "800" }}>{t("clubOn")}</Text>
          </View>
        ) : null}

        <View style={{ gap: S.md }}>
          {benefits.map(([icon, text]) => (
            <View key={text} style={{ flexDirection: "row", alignItems: "center", gap: S.md }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.card2, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={icon} size={18} color={c.accent} />
              </View>
              <Text style={{ flex: 1, color: c.ink, fontSize: F.md, fontWeight: "600", lineHeight: 21 }}>{text}</Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: "row", gap: S.md, marginTop: S.sm }}>
          <Plan id="pack5" />
          <Plan id="pack10" />
        </View>

        <View style={{ flex: 1 }} />
        <Btn label={t("buy")} onPress={purchase} loading={busy} />
        {msg ? <Text style={{ color: c.muted, textAlign: "center" }}>{msg}</Text> : null}
        <Text style={{ color: c.accent, fontWeight: "800", textAlign: "center" }}>{t("noSub")}</Text>
        <P style={{ textAlign: "center", fontSize: F.xs }}>{t("onceFine")}{DEMO ? ` ${t("demoPay")}` : ""}</P>
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", columnGap: S.xl, rowGap: S.sm }}>
          {DEMO ? null : <Pressable onPress={onRestore} hitSlop={10}><Text style={{ color: c.muted, fontWeight: "700" }}>{t("restore")}</Text></Pressable>}
          <Pressable onPress={() => router.push({ pathname: "/legal", params: { doc: "terms" } })} hitSlop={10} accessibilityRole="link"><Text style={{ color: c.muted, fontWeight: "700" }}>{t("termsFull")}</Text></Pressable>
          <Pressable onPress={() => router.push({ pathname: "/legal", params: { doc: "privacy" } })} hitSlop={10} accessibilityRole="link"><Text style={{ color: c.muted, fontWeight: "700" }}>{t("privacyFull")}</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
