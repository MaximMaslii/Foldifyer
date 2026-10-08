import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useI18n } from "@/i18n";
import { F, S, useColors } from "@/lib/theme";
import { Back, H1, P } from "@/components/ui";
import data from "@/lib/legalData.json";

type Block = string | string[];
type Doc = { title: string; intro: string; sections: [string, Block[]][] };

/** Privacy Policy, Terms of Use and "how to delete data", shown inside the app (the same texts the server hosts). */
export default function Legal() {
  const c = useColors();
  const { t } = useI18n();
  const { doc = "privacy" } = useLocalSearchParams<{ doc?: string }>();
  const d = (data.docs as unknown as Record<string, Doc>)[doc] ?? (data.docs as unknown as Record<string, Doc>).privacy;
  const para = { color: c.ink, fontSize: F.sm + 1, lineHeight: 22 };
  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: S.xl, paddingTop: S.sm, gap: S.md }}>
        <Back label={t("back")} />
        <H1>{d.title}</H1>
        <P>Last updated: {data.updated}</P>
        <Text style={para}>{d.intro}</Text>
        {d.sections.map(([head, blocks]) => (
          <View key={head} style={{ gap: S.sm, marginTop: S.sm }}>
            <Text accessibilityRole="header" style={{ color: c.ink, fontSize: F.lg, fontWeight: "800" }}>{head}</Text>
            {blocks.map((b, k) => Array.isArray(b)
              ? <View key={k} style={{ gap: 6 }}>{b.map((li, j) => <View key={j} style={{ flexDirection: "row", gap: S.sm }}><Text style={para}>•</Text><Text style={[para, { flex: 1 }]}>{li}</Text></View>)}</View>
              : <Text key={k} style={para}>{b}</Text>)}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
