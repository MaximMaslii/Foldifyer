// Phone version: turns the sheets into a PDF and opens the system menu (print, save to Files, send to a messenger).
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export async function printSheets(html: string, mode: "print" | "pdf"): Promise<void> {
  if (mode === "print") { await Print.printAsync({ html }); return; }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
  else await Print.printAsync({ uri });
}
