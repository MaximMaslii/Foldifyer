// Browser version: the SVG text goes straight into the page.
import { createElement } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

export function SvgView({ xml, style }: { xml: string; style?: StyleProp<ViewStyle> }) {
  const html = xml.replace(/width="[\d.]+mm" height="[\d.]+mm"/, 'width="100%" height="100%"');
  return <View style={style}>{createElement("div", { style: { width: "100%", height: "100%" }, dangerouslySetInnerHTML: { __html: html } })}</View>;
}
