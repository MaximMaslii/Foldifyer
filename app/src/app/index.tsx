import { ActivityIndicator, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { useSession } from "@/lib/session";
import { useI18n } from "@/i18n";
import { useColors, F, S } from "@/lib/theme";
import { Btn } from "@/components/ui";

/** Boot gate: decides where a (re)opened app should land. */
export default function Index() {
  const { booted, bootError, me, retryBoot, seen } = useSession();
  const { t } = useI18n();
  const c = useColors();
  if (!booted) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.bg }}><ActivityIndicator color={c.accent} /></View>;
  if (bootError || !me)
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: S.xl, gap: S.lg, backgroundColor: c.bg }}>
        <Text style={{ color: c.ink, fontSize: F.lg, textAlign: "center" }}>{t("somethingWrong")}</Text>
        <Btn label={t("retry")} onPress={retryBoot} style={{ alignSelf: "stretch" }} />
      </View>
    );
  return <Redirect href={seen ? "/(tabs)" : "/welcome"} />;
}
