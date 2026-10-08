import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useI18n } from "@/i18n";
import { useSession } from "@/lib/session";
import { api, ApiError, DEMO } from "@/lib/api";
import { takeShot, type Shot } from "@/lib/camera";
import { F, R, S, useColors } from "@/lib/theme";
import { Back, Btn, Field, H1, P, SectionTitle } from "@/components/ui";
import { FigView, sample } from "@/components/FigView";
import legal from "@/lib/legalData.json";
import type { Kind } from "@/lib/types";
import type { Strings } from "@/i18n/strings";

const FAIL: Record<string, keyof Strings> = { no_subject: "failNoSubject", several: "failSeveral", not_dressed: "failDressed", unclear: "failUnclear", error: "failError" };

/** One screen from photo to figure: photo → name → wait. */
export default function NewFig() {
  const c = useColors();
  const { t } = useI18n();
  const { create, putFig, refreshMe } = useSession();
  const kind: Kind = useLocalSearchParams<{ kind?: string }>().kind === "person" ? "person" : "pet";
  const [shot, setShot] = useState<Shot | null>(null);
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  async function pick(camera: boolean) {
    setErr(null);
    try { const s = await takeShot(camera); if (s) setShot(s); }
    catch { setErr(t("cameraDenied")); }
  }
  async function go() {
    setErr(null); setWaiting(true);
    try {
      const id = await create(shot?.base64 ?? "", kind, name.trim());
      for (let k = 0; k < 120 && alive.current; k++) {
        await new Promise((r) => setTimeout(r, 2500));
        const { fig } = await api.fig(id).catch(() => ({ fig: null }));
        if (!fig || fig.status === "generating") continue;
        if (fig.status === "ready") { putFig(fig); if (alive.current) router.replace({ pathname: "/fig/[id]", params: { id, fresh: "1" } }); return; }
        refreshMe().catch(() => {});
        setErr(t(FAIL[fig.reason ?? "error"] ?? "failError")); break;
      }
    } catch (e) {
      if (e instanceof ApiError && e.code === "paywall") { router.push("/packs"); }
      else setErr(e instanceof ApiError && e.code === "daily_limit" ? t("dailyLimit") : t("somethingWrong"));
    }
    if (alive.current) setWaiting(false);
  }

  if (waiting)
    return (
      <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center", padding: S.xl, gap: S.lg }}>
        <View style={{ opacity: 0.5 }}><FigView fig={sample(kind === "pet" ? "cat" : "boy", kind)} line style={{ width: 180, height: 220 }} /></View>
        <ActivityIndicator color={c.accent} size="large" />
        <Text style={{ color: c.ink, fontSize: F.xl, fontWeight: "800", textAlign: "center" }}>{t("making")}</Text>
        <P style={{ textAlign: "center" }}>{t("makingSub")}</P>
      </SafeAreaView>
    );

  const canGo = (!!shot || DEMO) && (kind === "pet" || agree);
  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: S.xl, paddingTop: S.sm, gap: S.lg }} keyboardShouldPersistTaps="handled">
        <Back label={t("back")} />
        <H1>{t(kind === "pet" ? "newPet" : "newPerson")}</H1>
        <SectionTitle>{t("photoTitle")}</SectionTitle>
        {shot ? (
          <View style={{ alignItems: "center", gap: S.md }}>
            <Image source={{ uri: shot.uri }} style={{ width: 200, height: 200, borderRadius: R.xl }} contentFit="cover" accessibilityIgnoresInvertColors />
            <Btn label={t("retake")} kind="ghost" small onPress={() => setShot(null)} />
          </View>
        ) : (
          <>
            <View style={{ flexDirection: "row", gap: S.md, backgroundColor: c.card2, borderRadius: R.lg, padding: S.lg, alignItems: "center" }}>
              <Ionicons name="bulb-outline" size={22} color={c.accent} />
              <Text style={{ flex: 1, color: c.ink, fontSize: F.sm, lineHeight: 20 }}>{t(kind === "pet" ? "tipPet" : "tipPerson")}</Text>
            </View>
            <Btn label={t("takePhoto")} icon="camera-outline" onPress={() => pick(true)} />
            <Btn label={t("pickPhoto")} icon="images-outline" kind="ghost" onPress={() => pick(false)} />
            {DEMO ? <P>{t("demoNoPhoto")}</P> : null}
          </>
        )}
        <SectionTitle>{t("nameTitle")}</SectionTitle>
        <Field label={`${t(kind === "pet" ? "namePet" : "namePerson")} — ${t("nameHint").toLowerCase()}`} value={name} onChangeText={setName} maxLength={24} autoCapitalize="words" />
        {kind === "person" ? (
          <Pressable onPress={() => setAgree((v) => !v)} accessibilityRole="checkbox" accessibilityState={{ checked: agree }} style={{ flexDirection: "row", gap: S.md, alignItems: "flex-start" }}>
            <Ionicons name={agree ? "checkbox" : "square-outline"} size={26} color={agree ? c.accent : c.muted} />
            <Text style={{ flex: 1, color: c.ink, fontSize: F.sm, lineHeight: 20 }}>{t("consent", { ai: legal.ai })}</Text>
          </Pressable>
        ) : null}
        <P>{t("photoPrivacy")}</P>
        {err ? <Text style={{ color: c.danger, fontSize: F.md, fontWeight: "600" }}>{err}</Text> : null}
        <Btn label={t("makeIt")} icon="sparkles-outline" onPress={go} disabled={!canGo} />
      </ScrollView>
    </SafeAreaView>
  );
}
