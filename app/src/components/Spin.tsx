import { useMemo, useRef, useState } from "react";
import { PanResponder, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SvgView } from "./SvgView";

/** A drawing that turns when dragged sideways. `make` draws it for an angle in degrees. */
export function Spin({ make, hint, style, ink = "#7A6A58" }: { make: (yaw: number) => string; hint: string; style?: StyleProp<ViewStyle>; ink?: string }) {
  const [yaw, setYaw] = useState(-24);
  const from = useRef(-24), cur = useRef(-24);
  const pan = useMemo(() => PanResponder.create({
    // Only sideways drags turn the figure, so the page still scrolls up and down.
    onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderGrant: () => { from.current = cur.current; },
    onPanResponderMove: (_e, g) => { const next = Math.round((from.current - g.dx * 0.9) / 6) * 6; if (next !== cur.current) { cur.current = next; setYaw(next); } },
    onPanResponderTerminationRequest: () => false,
  }), []);
  const xml = useMemo(() => make(yaw), [make, yaw]);
  return (
    <View style={style} {...pan.panHandlers} accessibilityHint={hint}>
      <SvgView xml={xml} style={{ flex: 1 }} />
      <View pointerEvents="none" style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingBottom: 4 }}>
        <Ionicons name="swap-horizontal" size={14} color={ink} />
        <Text style={{ color: ink, fontSize: 12, fontWeight: "600" }}>{hint}</Text>
      </View>
    </View>
  );
}
