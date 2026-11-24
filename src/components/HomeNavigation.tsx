import { Pressable, StyleSheet, View } from "react-native";
import { DesignAsset } from "./DesignAsset";
import { C, fonts, Label } from "./ui";

export function HomeIcon({ name, size = 24 }: {
  name: "home" | "ask" | "bell" | "trash" | "upload" | "info";
  color?: string;
  size?: number;
}) {
  return <DesignAsset name={name} width={size} height={name === "ask" ? size * 23 / 24 : size} />;
}
export function StatementFolder() {
  return <DesignAsset name="folder" width={66.127} height={54.417} />;
}

export function HomeNavigation({ onHome, onProfile, onAsk, initial, active = "Home" }: {
  onHome: () => void;
  onProfile: () => void;
  onAsk?: () => void;
  initial: string;
  active?: "Home" | "Ask" | "Profile";
}) {
  return <View style={styles.dock}>{(["Home", "Ask", "Profile"] as const).map(tab => {
    const selected = active === tab;
    const action = tab === "Home" ? onHome : tab === "Ask" ? onAsk : onProfile;
    const icon = tab === "Profile" ? <View style={styles.avatar}><Label style={styles.initial}>{initial}</Label></View> :
      <DesignAsset name={tab === "Home" ? selected ? "home" : "homeOutline" : selected ? "askSelected" : "ask"} width={tab === "Ask" && selected ? 38 : 25} height={tab === "Ask" ? selected ? 38 : 23 : 25} />;
    return <Pressable key={tab} accessibilityRole="button" accessibilityLabel={tab}
      accessibilityState={{ selected, disabled: !action }} onPress={action} disabled={!action}
      style={selected ? [styles.selected, tab === "Ask" && { width: 91 }] : styles.item}>
      {selected && tab !== "Ask" ? <View style={styles.selectedIcon}>{icon}</View> : icon}
      <Label style={selected ? styles.selectedLabel : styles.label}>{tab}</Label>
    </Pressable>;
  })}</View>;
}
const styles = StyleSheet.create({
  dock: { height: 72, padding: 8, borderRadius: 40, backgroundColor: "white", flexDirection: "row", alignItems: "center", gap: 17 },
  selected: { height: 51, width: 103, paddingHorizontal: 8, borderRadius: 30, backgroundColor: C.blue, flexDirection: "row", alignItems: "center", gap: 8 },
  selectedIcon: { width: 38, height: 38, borderRadius: 22, backgroundColor: "#FFFFFF55", justifyContent: "center", alignItems: "center" },
  selectedLabel: { color: "white", fontSize: 12, fontFamily: fonts.bold },
  item: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", gap: 4 },
  label: { color: "#737373", fontSize: 12 },
  avatar: { width: 25, height: 25, borderRadius: 15, backgroundColor: "#DDF2FF", alignItems: "center", justifyContent: "center" },
  initial: { color: C.blue, fontFamily: fonts.bold, fontSize: 12 },
});
