import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { DesignAsset, designAssets } from "../components/DesignAsset";
import { useAppState } from "../lib/AppProvider";
import { Button, C, fonts, Label, Link } from "../components/ui";
import { AccountAvatar, CategoryRows, p, SampleDataNotice, AppScreen, AppSheet } from "../components/AppUI";

const snapshots = [
  { title: "Income", amount: "₦480,000", icon: "storyIncome" as const },
  { title: "Total Spent", amount: "₦328,000", icon: "storySpent" as const },
  { title: "Balance", amount: "₦152,000", icon: "storyBalance" as const },
];

export function Story() {
  const { user, activeStatementId } = useAppState();
  const [insight, setInsight] = useState(false);
  return <AppScreen>
    <View style={p.row}><View style={styles.identity}>
      <AccountAvatar size={50} />
      <View style={{ flexShrink: 1 }}><Label style={styles.greeting}>Good morning,</Label><Label style={styles.name}>{user?.firstName}</Label></View>
    </View><Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={() => router.push("/settings?section=notifications")} style={styles.bell}><DesignAsset name="bell" width={25} /></Pressable></View>
    <Pressable accessibilityRole="button" accessibilityLabel="Ask about your spending" onPress={() => router.push("/ask")} style={styles.search}>
      <Label style={styles.searchText}>Ask about your spending...</Label><DesignAsset name="ask" width={20} />
    </Pressable>
    <Label style={styles.title}>Here’s your money story</Label>
    <View style={styles.period}><View style={styles.dot} /><Label style={styles.periodText}>July 2026 · Sample analysis</Label></View>
    <View style={styles.heroWrap}>
      <View style={styles.hero}>
        <Image source={designAssets.storyPatternTexture} resizeMode="cover" accessible={false} style={styles.heroTexture} />
        <View style={styles.heroContent}>
          <Label style={styles.heroTitle}>{"Your Spending Rises\nAfter Payday"}</Label>
          <Label style={styles.heroText}>39% of your flexible spending happened within seven days of receiving your income.</Label>
          <Pressable accessibilityRole="button" accessibilityLabel="See Pattern" hitSlop={9} onPress={() => setInsight(true)} style={styles.insight}>
            <Label style={styles.insightText}>See Pattern</Label><DesignAsset name="storyPatternArrow" width={8} />
          </Pressable>
        </View>
      </View>
      <DesignAsset name="storyPiggyBank" width={138.104} height={165} style={styles.piggyBank} />
    </View>
    <View style={styles.savings}>
      <View style={p.row}><View style={styles.savingsAmount}><Label style={styles.savingsValue}>₦16,000</Label><View style={styles.savingsDot} /><Label style={styles.savingsPeriod}>over 4 weeks</Label></View><View style={styles.savingsBadge}><Label style={styles.savingsBadgeText}>Potential Savings</Label></View></View>
      <View style={styles.rule} />
      <Label style={styles.savingsTitle}>One fewer delivery. A little more breathing room.</Label>
      <Label style={styles.savingsDescription}>Your delivery orders averaged <Label style={styles.savingsEmphasis}>₦4,000</Label>. Skipping one each week could leave you with about <Label style={styles.savingsEmphasis}>₦16,000</Label> over four weeks.</Label>
    </View>
    <Label style={styles.section}>Money Snapshot</Label>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel="Money snapshot cards" style={styles.snapshotScroll} contentContainerStyle={styles.snapshots}>
      {snapshots.map(item => <View key={item.title} style={styles.snapshot}>
        <DesignAsset name={item.icon} width={32} style={styles.snapshotIcon} />
        <Label style={styles.snapshotLabel}>{item.title}</Label>
        <Label style={[styles.snapshotValue, item.title === "Balance" && { color: C.blue }]}>{item.amount}</Label>
      </View>)}
    </ScrollView>
    <View style={[p.row, { marginTop: 24, marginBottom: 16 }]}><Label style={styles.categoryTitle}>Where your money went</Label><Link onPress={() => router.push("/spending")} style={{ fontSize: 12 }}>View</Link></View>
    <CategoryRows />
    <SampleDataNotice />
    <View style={{ gap: 16 }}>
      {activeStatementId ? (
        <Button
          title="Review your transactions"
          secondary
          onPress={() =>
            router.push({
              pathname: "/review",
              params: { statementId: activeStatementId },
            })
          }
        />
      ) : (
        <Button
          title="Upload a statement to review"
          secondary
          onPress={() =>
            router.replace({ pathname: "/", params: { view: "upload" } })
          }
        />
      )}
      <Link onPress={() => router.push("/")} style={{ textAlign: "center" }}>Back to statement upload</Link>
    </View>
    <AppSheet visible={insight} title="Your spending after payday" onClose={() => setInsight(false)}>
      <Label style={p.body}>In this sample, 39% of flexible spending happened within seven days of receiving income.</Label>
      <Label style={[p.caption, { marginTop: 16 }]}>This illustrates a timing pattern, not the reason for it. Your own transactions and patterns will appear when analysis is connected.</Label>
    </AppSheet>
  </AppScreen>;
}
export function Spending() {
  return <AppScreen back={() => router.replace("/story")}><Label style={[p.heading, { marginTop: 32 }]}>Where your money went</Label><SampleDataNotice />
    <Label style={p.caption}>July 2026 · Sample spending breakdown</Label><View style={{ marginTop: 24 }}><CategoryRows /></View>
    <View style={[p.card, { marginTop: 8 }]}><View style={p.row}><Label>Other spending</Label><Label>₦230,000</Label></View><Label style={p.caption}>42% of total spending</Label></View>
    <View style={[p.card, { marginTop: 24 }]}><Label style={p.section}>Total spent</Label><Label style={p.heading}>₦548,000</Label></View>
    <View style={{ marginTop: 24 }}><Button title="Ask about your spending" onPress={() => router.push("/ask")} /></View>
  </AppScreen>;
}
const styles = StyleSheet.create({
  identity: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  greeting: { fontSize: 12, lineHeight: 14 },
  name: { fontSize: 16, lineHeight: 19, fontFamily: fonts.medium, marginTop: 6 },
  bell: { borderRadius: 81, padding: 8, backgroundColor: "#1BA5FE1A" },
  search: { minHeight: 54, borderRadius: 40, paddingLeft: 21, paddingRight: 16, backgroundColor: "#F3F5F6", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 26 },
  searchText: { color: "#A5ACB6", fontSize: 14, flexShrink: 1 },
  title: { fontFamily: fonts.medium, fontSize: 25, lineHeight: 30, marginTop: 20 },
  period: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: "#DCF1FE", backgroundColor: "#F0F9FF", paddingHorizontal: 11, paddingVertical: 7, borderRadius: 36, marginTop: 12, marginBottom: 20 },
  periodText: { fontSize: 12, lineHeight: 14, color: "#48505B", fontFamily: fonts.medium },
  dot: { width: 6, height: 6, borderRadius: 6, backgroundColor: "#00C995" },
  heroWrap: { position: "relative" },
  hero: { minHeight: 155, borderRadius: 20, borderWidth: 1, borderColor: "#D6D6D666", backgroundColor: "#1BA5FE", overflow: "hidden" },
  heroTexture: { position: "absolute", left: 0, top: 0, width: "100%", height: "100%", opacity: 0.4 },
  heroContent: { width: "64%", paddingLeft: 13, paddingTop: 20, paddingBottom: 16, gap: 8 },
  heroTitle: { color: "white", fontFamily: fonts.medium, fontSize: 20, lineHeight: 24 },
  heroText: { color: "white", fontSize: 10, lineHeight: 12 },
  piggyBank: { position: "absolute", right: "1.43%", top: -2, width: "40.38%", height: undefined, aspectRatio: 138.104 / 165, pointerEvents: "none" },
  insight: { alignSelf: "flex-start", backgroundColor: "white", paddingHorizontal: 10, minHeight: 26, borderRadius: 100, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  insightText: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 12, color: C.blue },
  savings: { marginTop: 16, borderRadius: 20, backgroundColor: "white", padding: 10 },
  savingsAmount: { flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 1 },
  savingsValue: { color: C.blue, fontFamily: fonts.medium, fontSize: 14, lineHeight: 16 },
  savingsDot: { width: 4, height: 4, borderRadius: 4, backgroundColor: "#D6D6D6" },
  savingsPeriod: { color: "#737373", fontSize: 12, lineHeight: 14 },
  savingsBadge: { paddingHorizontal: 10, minHeight: 24, justifyContent: "center", borderRadius: 100, backgroundColor: "#F0F9FF" },
  savingsBadgeText: { color: C.blue, fontSize: 10, lineHeight: 10 },
  rule: { height: 1, backgroundColor: "#D6D6D6", marginVertical: 10 },
  savingsTitle: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 14 },
  savingsDescription: { fontSize: 10, lineHeight: 14, color: "#737373", marginTop: 8 },
  savingsEmphasis: { fontFamily: fonts.medium, color: "black", fontSize: 10, lineHeight: 14 },
  section: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 19, marginTop: 16, marginBottom: 16 },
  snapshotScroll: { marginRight: -24 },
  snapshots: { gap: 8, paddingRight: 24 },
  snapshot: { width: 162, height: 186, backgroundColor: "white", borderColor: "#D6D6D666", borderWidth: 1, borderRadius: 20, paddingHorizontal: 15, paddingBottom: 19, justifyContent: "flex-end" },
  snapshotIcon: { position: "absolute", right: 10, top: 10 },
  snapshotLabel: { fontSize: 10, lineHeight: 12, color: "#808893", marginBottom: 8 },
  snapshotValue: { fontSize: 24, lineHeight: 29, fontFamily: fonts.medium },
  categoryTitle: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 19 },
});
