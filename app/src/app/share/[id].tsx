import { useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useI18n } from "@/i18n";
import { useSession } from "@/lib/session";
import { takeShot, type Shot } from "@/lib/camera";
import { shareView } from "@/lib/share";
import { F, R, S, useColors } from "@/lib/theme";
import { Back, Btn, H1, P, Segmented } from "@/components/ui";
import { FigView } from "@/components/FigView";
import { SvgView } from "@/components/SvgView";
import { Chip } from "@/components/ui";
import { COLLECTIONS, sceneArt, type Collection } from "@/lib/club";
import { router } from "expo-router";

/** A picture to post: the drawn figure, or a photo of the finished paper toy, always signed with the app's name. */
export default function Share() {
  const c = useColors();
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { figs, me } = useSession();
  const fig = figs.find((f) => f.id === id);
  const [scene, setScene] = useState<Collection["id"] | null>(null);
  const card = useRef<View>(null);
  const [photo, setPhoto] = useState<Shot | null>(null);
  const [mode, setMode] = useState<"drawn" | "photo">("drawn");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!fig) return <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: c.bg, padding: S.xl }}><Back label={t("back")} /></SafeAreaView>;

  async function snap() { try { const s = await takeShot(true, 1280); if (s) { setPhoto(s); setMode("photo"); } } catch { setMsg(t("cameraDenied")); } }
  async function go() {
    setBusy(true); setMsg(null);
    try { if (!(await shareView(card, t("shareText", { name: fig!.name || t("shareNoName") })))) setMsg(t("shareNo")); }
    catch { setMsg(t("somethingWrong")); }
    finally { setBusy(false); }
  }
  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: S.xl, paddingTop: S.sm, gap: S.lg }}>
        <Back label={t("back")} />
        <H1>{t("shareTitle")}</H1>
        {photo ? <Segmented<"drawn" | "photo"> value={mode} onChange={setMode} options={[{ v: "drawn", label: t("shareDrawn") }, { v: "photo", label: t("sharePhoto") }]} /> : null}
        {/* Fixed light colours: the shared picture must look the same in the dark theme. */}
        <View ref={card} collapsable={false} style={{ backgroundColor: "#FFE9C7", borderRadius: R.xl, overflow: "hidden", alignItems: "center" }}>
          {mode === "photo" && photo
            ? <Image source={{ uri: photo.uri }} style={{ width: "100%", aspectRatio: 1 }} contentFit="cover" />
            : (
              <View style={{ alignSelf: "stretch", height: 320 }}>
                {scene ? <SvgView xml={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="100%" height="100%" preserveAspectRatio="xMidYMax slice">${sceneArt(scene)}</svg>`} style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} /> : null}
                <FigView fig={fig} style={{ flex: 1, marginTop: S.xl }} />
              </View>
            )}
          <View style={{ alignSelf: "stretch", flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: S.lg, backgroundColor: "#FFF8EE" }}>
            <Text numberOfLines={1} style={{ flex: 1, color: "#2B2118", fontSize: F.xl, fontWeight: "800" }}>{fig.name}</Text>
            <Image source={require("../../../assets/wordmark.png")} style={{ width: 98, height: 24 }} contentFit="contain" />
          </View>
        </View>
        {mode === "drawn" ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: S.sm }}>
            <Chip label={t("sceneNone")} on={!scene} onPress={() => setScene(null)} />
            {COLLECTIONS.map((col) => <Chip key={col.id} label={`${me?.club ? "" : "🔒 "}${t(`c_${col.id}`)}`} on={scene === col.id} onPress={() => (me?.club ? setScene(col.id) : router.push("/packs"))} />)}
          </View>
        ) : null}
        <Btn label={t("shareBtn")} icon="share-social-outline" onPress={go} loading={busy} />
        <Btn label={t("shareSnap")} icon="camera-outline" kind="ghost" onPress={snap} />
        {msg ? <P style={{ textAlign: "center" }}>{msg}</P> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
