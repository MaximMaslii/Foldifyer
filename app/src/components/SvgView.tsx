// Shows a drawing made by lib/paper.ts (SVG text). Phone version.
import { View, type StyleProp, type ViewStyle } from "react-native";
import { SvgXml } from "react-native-svg";

export function SvgView({ xml, style }: { xml: string; style?: StyleProp<ViewStyle> }) {
  return <View style={style}><SvgXml xml={xml.replace(/width="[\d.]+mm" height="[\d.]+mm"/, "")} width="100%" height="100%" /></View>;
}
