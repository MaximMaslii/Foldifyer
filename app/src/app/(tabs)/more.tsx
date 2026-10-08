import { useState } from "react";
import { Alert, Linking, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useI18n } from "@/i18n";
import { useSession } from "@/lib/session";
import { SUPPORT_EMAIL } from "@/lib/api";
import { F, S, setThemeMode, useColors, useThemeMode, type ThemeMode } from "@/lib/theme";
import { Btn, Card, H1, P, SectionTitle, Segmented } from "@/components/ui";
import legal from "@/lib/legalData.json";
import type { Lang, Paper } from "@/lib/types";

export default function More() {
  const c = useColors();
  const { t, lang, setLang } = useI18n();
  const { me, paper, setPaper, wipe } = useSession();
  const mode = useThemeMode();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const left = !me ? "" : me.plus ? t("leftPlus") : me.clubLeft + me.credits + me.freeLeft > 0 ? t("leftN", { n: me.clubLeft + me.credits + me.freeLeft }) : t("leftNone");

  async function doWipe() { setBusy(true); try { await wipe(); setMsg(t("deleted")); } catch { setMsg(t("somethingWrong")); } finally { setBusy(false); } }
  function askWipe() {
    if (Platform.OS === "web") { if (globalThis.confirm?.(t("deleteAllAsk"))) void doWipe(); return; }
    Alert.alert(t("deleteAll"), t("deleteAllAsk"), [{ text: t("cancel"), style: "cancel" }, { text: t("delete"), style: "destructive", onPress: () => void doWipe() }]);
  }
  const Row = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <Pressable onPress={onPress} accessibilityRole="link" style={{ flexDirection: "row", alignItems: "center", minHeight: 44 }}>
      <Text style={{ flex: 1, color: c.ink, fontSize: F.md, fontWeight: "600" }}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={c.muted} />
    </Pressable>
  );
  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: S.xl, gap: S.lg }}>
        <H1>{t("moreTitle")}</H1>
        <Card>
          <Text style={{ color: c.ink, fontSize: F.lg, fontWeight: "800" }}>{left}</Text>
          {me?.club ? <Text style={{ color: c.accent, fontWeight: "700" }}>{t("clubOn")} · {t("clubLeft", { n: me.clubLeft })}</Text> : null}
          {me?.plus ? null : <Btn label={t("getMore")} icon="gift-outline" onPress={() => router.push("/packs")} />}
        </Card>
        <SectionTitle>{t("paper")}</SectionTitle>
        <Segmented<Paper> value={paper} onChange={setPaper} options={[{ v: "a4", label: "A4" }, { v: "letter", label: "Letter (US)" }]} />
        <SectionTitle>{t("language")}</SectionTitle>
        <Segmented<Lang> value={lang} onChange={setLang} options={[{ v: "en", label: "English" }, { v: "ru", label: "Русский" }, { v: "de", label: "Deutsch" }]} />
        <SectionTitle>{t("theme")}</SectionTitle>
        <Segmented<ThemeMode> value={mode} onChange={setThemeMode} options={[{ v: "system", label: t("themeSystem") }, { v: "light", label: t("themeLight") }, { v: "dark", label: t("themeDark") }]} />
        <SectionTitle>{t("docs")}</SectionTitle>
        <Card style={{ gap: 0 }}>
          <Row label={t("privacyFull")} onPress={() => router.push({ pathname: "/legal", params: { doc: "privacy" } })} />
          <Row label={t("termsFull")} onPress={() => router.push({ pathname: "/legal", params: { doc: "terms" } })} />
          <Row label={t("deleteDoc")} onPress={() => router.push({ pathname: "/legal", params: { doc: "delete" } })} />
          {SUPPORT_EMAIL ? <Row label={t("support")} onPress={() => { Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Foldifyer%20${me?.deviceId ?? ""}`).catch(() => {}); }} /> : null}
        </Card>
        <P>{t("aiNote", { ai: legal.ai })}</P>
        <Btn label={t("deleteAll")} kind="ghost" icon="trash-outline" onPress={askWipe} loading={busy} />
        {msg ? <Text style={{ color: c.muted, textAlign: "center" }}>{msg}</Text> : null}
        <P style={{ fontSize: 11 }}>{t("deviceId")}: {me?.deviceId}</P>
      </ScrollView>
    </SafeAreaView>
  );
}
