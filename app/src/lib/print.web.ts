// Browser version: opens the print window (where "Save as PDF" is also offered).
export async function printSheets(html: string, _mode: "print" | "pdf"): Promise<void> {
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(frame);
  frame.srcdoc = html;
  await new Promise<void>((r) => { frame.onload = () => r(); });
  frame.contentWindow?.focus();
  frame.contentWindow?.print();
  setTimeout(() => frame.remove(), 60_000);
}
