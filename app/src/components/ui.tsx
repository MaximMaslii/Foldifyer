import { Children, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { F, R, S, useColors } from "@/lib/theme";

const tap = () => { Haptics.selectionAsync().catch(() => {}); };

export function Btn({ label, onPress, kind = "primary", loading, disabled, icon, style, small }: {
  label: string; onPress: () => void; kind?: "primary" | "ghost" | "dark"; loading?: boolean; disabled?: boolean; icon?: keyof typeof Ionicons.glyphMap; style?: StyleProp<ViewStyle>; small?: boolean;
}) {
  const c = useColors();
  const bg = kind === "primary" ? c.primary : kind === "dark" ? c.ink : c.card;
  const fg = kind === "primary" ? c.onPrimary : kind === "dark" ? c.bg : c.ink;
  return (
    <Pressable accessibilityRole="button" onPress={() => { tap(); onPress(); }} disabled={disabled || loading}
      style={({ pressed }) => [st.btn, { backgroundColor: bg, borderColor: kind === "ghost" ? c.line : bg, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 }, style]}>
      {loading ? <ActivityIndicator color={fg} /> : (
        <View style={st.row}>
          {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
          <Text numberOfLines={2} style={[st.btnText, { color: fg }, small && { fontSize: F.sm, lineHeight: 17 }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return <View style={[{ backgroundColor: c.card, borderRadius: R.lg, padding: S.lg, gap: S.md }, style]}>{children}</View>;
}

export function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={() => { tap(); onPress(); }} accessibilityRole="radio" accessibilityState={{ checked: on }}
      style={[st.chip, { backgroundColor: on ? c.ink : c.card, borderColor: on ? c.ink : c.line }]}>
      <Text numberOfLines={2} style={{ color: on ? c.bg : c.ink, fontWeight: "700", fontSize: F.sm, textAlign: "center", paddingVertical: 6 }}>{label}</Text>
    </Pressable>
  );
}

/** Width the content really has: the whole app is capped at MAX_W and centered on tablets. */
export const MAX_W = 720;
export function useContentWidth() { return Math.min(useWindowDimensions().width, MAX_W) - S.xl * 2; }

/** Tidy grid of equal cells: 2 columns on phones, more on wide screens. */
export function Grid({ children, min = 150, gap = S.md }: { children: React.ReactNode; min?: number; gap?: number }) {
  const guess = useContentWidth();
  const [measured, setMeasured] = useState(0);
  const w = measured || guess;
  const cols = Math.max(2, Math.min(4, Math.floor((w + gap) / (min + gap))));
  const items = Children.toArray(children);
  const rows: React.ReactNode[][] = [];
  for (let k = 0; k < items.length; k += cols) rows.push(items.slice(k, k + cols));
  return (
    <View style={{ gap }} onLayout={(e) => { const x = Math.round(e.nativeEvent.layout.width); if (x && x !== measured) setMeasured(x); }}>
      {rows.map((r, k) => (
        <View key={k} style={{ flexDirection: "row", gap }}>
          {r.map((it, j) => <View key={j} style={{ flex: 1, minWidth: 0 }}>{it}</View>)}
          {Array.from({ length: cols - r.length }, (_, j) => <View key={`e${j}`} style={{ flex: 1 }} />)}
        </View>
      ))}
    </View>
  );
}

export function Segmented<T extends string | number>({ options, value, onChange }: { options: { v: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const c = useColors();
  return (
    <View style={[st.seg, { backgroundColor: c.card2 }]}>
      {options.map((o) => (
        <Pressable key={String(o.v)} onPress={() => { tap(); onChange(o.v); }} accessibilityRole="radio" accessibilityState={{ checked: value === o.v }} style={[st.segItem, value === o.v && { backgroundColor: c.card }]}>
          <Text style={{ fontWeight: "700", color: value === o.v ? c.ink : c.muted, fontSize: F.sm }}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  const c = useColors();
  return <Text style={{ fontSize: F.xs, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase", color: c.muted }}>{children}</Text>;
}

export function H1({ children }: { children: React.ReactNode }) {
  const c = useColors();
  return <Text style={{ fontSize: F.xxl, fontWeight: "800", color: c.ink, letterSpacing: -0.3 }}>{children}</Text>;
}
export function P({ children, style }: { children: React.ReactNode; style?: StyleProp<import("react-native").TextStyle> }) {
  const c = useColors();
  return <Text style={[{ fontSize: F.sm, color: c.muted, lineHeight: 20 }, style]}>{children}</Text>;
}

export function Back({ label }: { label: string }) {
  const c = useColors();
  return (
    <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))} accessibilityRole="button" hitSlop={8} style={{ flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44, alignSelf: "flex-start" }}>
      <Ionicons name="chevron-back" size={22} color={c.ink} />
      <Text style={{ color: c.ink, fontWeight: "700", fontSize: F.md }}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, ...rest }: { label: string } & TextInputProps) {
  const c = useColors();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: c.muted, fontSize: F.sm, fontWeight: "600" }}>{label}</Text>
      <TextInput accessibilityLabel={label} placeholderTextColor={c.muted} {...rest}
        style={[{ backgroundColor: c.card, borderColor: c.line, borderWidth: 1.5, borderRadius: R.md, paddingHorizontal: S.lg, minHeight: 52, color: c.ink, fontSize: F.md }, rest.style]} />
    </View>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: S.sm, flexShrink: 1 },
  btn: { minHeight: 52, borderRadius: R.md, alignItems: "center", justifyContent: "center", paddingHorizontal: S.md, paddingVertical: 6, borderWidth: 1.5 },
  btnText: { fontSize: F.md, fontWeight: "700", textAlign: "center", flexShrink: 1 },
  chip: { paddingHorizontal: 12, minHeight: 44, justifyContent: "center", alignItems: "center", borderRadius: R.md, borderWidth: 1.5 },
  seg: { flexDirection: "row", padding: 4, borderRadius: R.md },
  segItem: { flex: 1, minHeight: 40, alignItems: "center", justifyContent: "center", borderRadius: R.sm },
});
