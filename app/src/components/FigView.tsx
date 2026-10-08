import { useMemo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { drawOpts } from "@/lib/session";
import { previewSvg } from "@/lib/paper";
import type { Fig } from "@/lib/types";
import { SvgView } from "./SvgView";

/** The assembled figure, drawn. */
export function FigView({ fig, line, style }: { fig: Fig; line?: boolean; style?: StyleProp<ViewStyle> }) {
  const xml = useMemo(() => previewSvg(fig, drawOpts(line)), [fig, line]);
  return <SvgView xml={xml} style={style} />;
}
/** A sample figure for the screens that explain the app. */
export const sample = (preset: string, kind: Fig["kind"], outfit: Fig["outfit"] = "none"): Fig => ({ id: preset, createdAt: "", status: "ready", kind, name: "", preset, outfit, level: "normal", free: false });
