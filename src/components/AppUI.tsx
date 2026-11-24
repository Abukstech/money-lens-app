import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { DesignAsset, designAssets } from "./DesignAsset";
import { HomeNavigation } from "./HomeNavigation";
import { Button, C, fonts, Label, Screen, useReducedMotion } from "./ui";
import { useAppState } from "../lib/AppProvider";

export function SampleDataNotice() {
  return <Label style={p.notice}>Sample data · Analysis not connected</Label>;
}
export function AppScreen({ children, active = "Home", back, bottom, navigation = true, scrollRef, onContentSizeChange }: {
  children: React.ReactNode; active?: "Home" | "Ask" | "Profile"; back?: () => void;
  bottom?: React.ReactNode; navigation?: boolean;
  scrollRef?: React.Ref<React.ComponentRef<typeof ScrollView>>; onContentSizeChange?: (width: number, height: number) => void;
}) {
  const { user } = useAppState();
  return <Screen colors={["#FFFFFF", "#F0F9FF"]} back={back} scrollRef={scrollRef} onContentSizeChange={onContentSizeChange}
    dockStyle={{ paddingHorizontal: 24 }}
    dock={bottom || navigation ? <>{bottom && <View style={{ marginBottom: navigation ? 24 : 0 }}>{bottom}</View>}
      {navigation && <View style={{ paddingHorizontal: 20 }}><HomeNavigation initial={(user?.firstName || user?.email || "U").charAt(0).toUpperCase()} active={active}
        onHome={() => router.replace("/")} onAsk={() => router.replace("/ask")}
        onProfile={() => router.replace("/profile")} /></View>}</> : undefined}>
    {children}
  </Screen>;
}
export function AccountAvatar({ size = 84 }: { size?: number }) {
  const { user } = useAppState();
  const initial = (user?.firstName || user?.email || "U").charAt(0).toUpperCase();
  return <View accessible accessibilityLabel="Your profile" style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#DCF1FE", alignItems: "center", justifyContent: "center" }}>
    <Label style={{ color: C.blue, fontFamily: fonts.bold, fontSize: size * 0.4 }}>{initial}</Label>
  </View>;
}
export function RoundAction({ name, label, onPress }: {
  name: keyof typeof designAssets; label: string; onPress: () => void;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={6} onPress={onPress}>
    <DesignAsset name={name} width={35} />
  </Pressable>;
}
export function AppHeader({ title, subtitle, children, sample = false }: {
  title: string; subtitle?: string; children?: React.ReactNode; sample?: boolean;
}) {
  return <><View style={p.row}><View style={{ flex: 1 }}><Label style={p.title}>{title}</Label>
    {subtitle && <Label style={p.caption}>{subtitle}</Label>}</View><View style={{ flexDirection: "row", gap: 7 }}>{children}</View></View>{sample ? <SampleDataNotice /> : <View style={{ height: 24 }} />}</>;
}
export function AppSheet({ title, children, visible, onClose, dismissTitle = "Done", busy = false }: {
  title: string; children: React.ReactNode; visible: boolean; onClose: () => void; dismissTitle?: string; busy?: boolean;
}) {
  const reduced = useReducedMotion();
  return <Modal visible={visible} transparent animationType={reduced ? "none" : "slide"} onRequestClose={() => { if (!busy) onClose(); }}>
    <View style={p.scrim}><View accessibilityViewIsModal style={p.sheet}>
      <Label style={[p.title, { marginBottom: 16 }]}>{title}</Label>{children}
      <View style={{ marginTop: 24 }}><Button title={dismissTitle} disabled={busy} onPress={onClose} /></View>
    </View></View>
  </Modal>;
}
export const categories = [
  { title: "Housing", amount: "₦155,000", percent: 28, icon: "house" as const },
  { title: "Food", amount: "₦92,000", percent: 17, icon: "food" as const },
  { title: "Transport", amount: "₦71,000", percent: 13, icon: "car" as const },
];
export function CategoryRows() {
  return <View style={{ gap: 7 }}>{categories.map(item => <View key={item.title} style={p.category}>
    <View style={p.categoryIcon}><DesignAsset name={item.icon} width={16} /></View>
    <View style={{ flex: 1 }}><View style={p.row}><Label style={p.body}>{item.title}</Label><Label style={p.body}>{item.amount}</Label></View>
      <View style={[p.row, { gap: 12, marginTop: 6 }]}><View style={p.track}><View style={[p.fill, { width: `${item.percent}%` }]} /></View><Label style={{ fontSize: 12 }}>{item.percent}%</Label></View>
    </View></View>)}</View>;
}
export const p = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  title: { fontFamily: fonts.medium, fontSize: 24, lineHeight: 29, letterSpacing: -0.4 },
  heading: { fontFamily: fonts.medium, fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  section: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 20, marginBottom: 14 },
  caption: { color: C.muted, fontSize: 14, lineHeight: 18, marginTop: 5 },
  body: { fontSize: 14, lineHeight: 18 },
  notice: { color: "#808893", fontSize: 11, lineHeight: 15, marginTop: 12, marginBottom: 20 },
  card: { backgroundColor: "white", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "#ECEEEF" },
  category: { flexDirection: "row", gap: 9, padding: 14, borderRadius: 11, backgroundColor: "white", borderColor: "#F0F1F2", borderWidth: 1, alignItems: "center" },
  categoryIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#F0F9FF", alignItems: "center", justifyContent: "center" },
  track: { flex: 1, height: 5, backgroundColor: "#E5E8EB", borderRadius: 6, overflow: "hidden" },
  fill: { height: 5, backgroundColor: C.blue, borderRadius: 6 },
  scrim: { flex: 1, backgroundColor: "#00000099", justifyContent: "flex-end" },
  sheet: { width: "96%", maxWidth: 520, alignSelf: "center", borderRadius: 40, padding: 24, paddingBottom: 30, marginBottom: 10, backgroundColor: "white" },
});
