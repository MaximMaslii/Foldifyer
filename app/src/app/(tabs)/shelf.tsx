import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useI18n } from "@/i18n";
import { useSession } from "@/lib/session";
import { F, R, S, useColors } from "@/lib/theme";
import { Btn, H1, P } from "@/components/ui";
import { FigView, sample } from "@/components/FigView";
import type { Fig } from "@/lib/types";

/** The collection: figures stand on wooden shelves, three to a board. */
export default function Shelf() {
  const c = useColors();
  const { t } = useI18n();
  const { figs } = useSession();
  const rows: Fig[][] = [];
  for (let k = 0; k < figs.length; k += 3) rows.push(figs.slice(k, k + 3));
  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: S.xl, gap: S.lg }}>
        <H1>{t("shelfTitle")}</H1>
        {figs.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: S.lg }}>
            <View style={{ opacity: 0.35 }}><FigView fig={sample("cat", "pet")} line style={{ width: 150, height: 180 }} /></View>
            <P style={{ textAlign: "center", fontSize: F.md }}>{t("shelfEmpty")}</P>
            <Btn label={t("shelfEmptyCta")} icon="add" onPress={() => router.push("/(tabs)")} style={{ alignSelf: "stretch" }} />
          </View>
        ) : (
          <>
            <P>{t("shelfCount", { n: figs.length })}</P>
            {rows.map((row, k) => (
              <View key={k}>
                <View style={{ flexDirection: "row", alignItems: "flex-end", paddingHorizontal: S.sm }}>
                  {row.map((f) => (
                    <Pressable key={f.id} onPress={() => router.push({ pathname: "/fig/[id]", params: { id: f.id } })} accessibilityRole="button" accessibilityLabel={f.name} style={{ flex: 1, alignItems: "center" }}>
                      <FigView fig={f} style={{ width: "100%", height: 128 }} />
                    </Pressable>
                  ))}
                  {Array.from({ length: 3 - row.length }, (_, j) => <View key={j} style={{ flex: 1 }} />)}
                </View>
                <View style={{ height: 12, borderRadius: 4, backgroundColor: c.shelf }} />
                <View style={{ flexDirection: "row", paddingHorizontal: S.sm, paddingTop: 4 }}>
                  {row.map((f) => <Text key={f.id} numberOfLines={1} style={{ flex: 1, textAlign: "center", color: c.ink, fontWeight: "700", fontSize: F.sm }}>{f.name}</Text>)}
                  {Array.from({ length: 3 - row.length }, (_, j) => <View key={j} style={{ flex: 1 }} />)}
                </View>
              </View>
            ))}
            <View style={{ flex: 1 }} />
            {figs.length ? <Btn label={t("setBtn")} icon="people-outline" kind="ghost" onPress={() => router.push("/set")} /> : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
