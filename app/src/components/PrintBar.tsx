import { useState } from "react";
import { Platform, Text, View } from "react-native";
import { useI18n } from "@/i18n";
import { useSession } from "@/lib/session";
import { printHtml } from "@/lib/paper";
import { printSheets } from "@/lib/print";
import { S, useColors } from "@/lib/theme";
import { Btn } from "./ui";

/** The two buttons under every template: print now, or send the PDF somewhere (mail, messenger, a computer with a printer). */
export function PrintBar({ sheets, disabled }: { sheets: () => string[]; disabled?: boolean }) {
  const { t } = useI18n();
  const c = useColors();
  const { paper } = useSession();
  const [busy, setBusy] = useState<"print" | "pdf" | null>(null);
  const [err, setErr] = useState(false);
  async function go(mode: "print" | "pdf") {
    setBusy(mode); setErr(false);
    try { await printSheets(printHtml(sheets(), paper), mode); }
    catch { setErr(true); }
    finally { setBusy(null); }
  }
  return (
    <View style={{ gap: S.sm }}>
      <View style={{ flexDirection: "row", gap: S.md }}>
        <Btn label={t("print")} icon="print-outline" onPress={() => go("print")} loading={busy === "print"} disabled={disabled || !!busy} style={{ flex: 1 }} />
        {Platform.OS === "web" ? null : <Btn label={t("sendPdf")} icon="share-outline" kind="ghost" onPress={() => go("pdf")} loading={busy === "pdf"} disabled={disabled || !!busy} style={{ flex: 1 }} />}
      </View>
      {err ? <Text style={{ color: c.danger, textAlign: "center" }}>{t("printFail")}</Text> : null}
    </View>
  );
}
