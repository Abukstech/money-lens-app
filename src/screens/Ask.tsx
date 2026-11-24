import { type ComponentRef, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { DesignAsset } from "../components/DesignAsset";
import { C, fonts, Label, Link, useReducedMotion } from "../components/ui";
import { CategoryRows, p, AppHeader, SampleDataNotice, AppScreen, AppSheet, RoundAction } from "../components/AppUI";

const prompts = [
  { title: "SPENDING", questions: ["Where did most of my money go?", "How much did I spend on food?"] },
  { title: "HABITS", questions: ["What did I spend the most on?", "Why did I spend more this month?"] },
  { title: "SAVING", questions: ["What could I reduce?"] },
];
export function Ask() {
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const reduced = useReducedMotion();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [messages, setMessages] = useState<string[]>(q ? [q] : []);
  const [draft, setDraft] = useState("");
  const send = (question: string) => { if (!question.trim()) return; setMessages(current => [...current, question.trim()]); setDraft(""); };
  const composer = <View style={styles.composer}><TextInput accessibilityLabel="Ask about your spending" placeholder="Ask about your spending..." placeholderTextColor="#A5ACB6" value={draft} onChangeText={setDraft} onSubmitEditing={() => send(draft)} returnKeyType="send" maxLength={500} style={styles.input} />
    <Pressable accessibilityRole="button" accessibilityLabel="Send question" accessibilityState={{ disabled: !draft.trim() }} disabled={!draft.trim()} onPress={() => send(draft)} style={[styles.send, !draft.trim() && { opacity: 0.55 }]}><DesignAsset name="send" width={26.667} /></Pressable></View>;
  return <AppScreen active="Ask" bottom={composer} navigation={!messages.length} scrollRef={scroll} onContentSizeChange={() => { if (messages.length > 1) scroll.current?.scrollToEnd({ animated: !reduced }); }}>
    <AppHeader sample title="Ask MoneyLens" subtitle="July 2026 statement">
      {!!messages.length && <RoundAction name="compose" label="New conversation" onPress={() => { setMessages([]); setDraft(""); router.setParams({ q: "" }); }} />}
      <RoundAction name="clock" label="Chat history" onPress={() => router.push("/history")} />
    </AppHeader>
    {!messages.length ? <>
      <Label style={[p.heading, { marginTop: 20 }]}>What would you like to know?</Label>
      <Label style={[p.caption, { fontSize: 16, lineHeight: 20, marginTop: 8 }]}>Ask questions about your July 2026 statement</Label>
      {prompts.map(group => <View key={group.title} style={{ marginTop: 38 }}><Label style={{ fontSize: 14, color: "#667080", marginBottom: 16 }}>{group.title}</Label>
        <View style={{ gap: 12 }}>{group.questions.map(question => <Pressable key={question} accessibilityRole="button" onPress={() => send(question)} style={styles.question}>
          <Label style={[p.body, { flex: 1 }]}>{question}</Label><DesignAsset name="back" width={16} style={{ transform: [{ rotate: "180deg" }] }} />
        </Pressable>)}</View></View>)}
    </> : <View style={{ gap: 28, paddingBottom: 12 }}>{messages.map((question, index) => <View key={`${index}-${question}`}>
      <View style={styles.user}><Label style={{ color: "white", fontSize: 14, lineHeight: 18 }}>{question}</Label></View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 32, marginBottom: 16 }}><DesignAsset name="lensBlue" width={20.316} height={20} /><Label style={{ fontSize: 14 }}>MoneyLens</Label></View>
      <SampleAnswer question={question} />
      <View style={{ alignItems: "flex-start", gap: 8, marginTop: 16 }}>{["How much did I spend on food?", "What could I reduce?"].filter(item => item !== question).map(item => <Pressable key={item} accessibilityRole="button" onPress={() => send(item)} style={styles.suggestion}><Label style={p.body}>{item}</Label></Pressable>)}</View>
    </View>)}<Link onPress={() => router.replace("/story")}>Back to your money story</Link></View>}
  </AppScreen>;
}
function SampleAnswer({ question }: { question: string }) {
  const reduced = question === "What could I reduce?";
  const food = question === "How much did I spend on food?";
  const breakdown = question === "Where did most of my money go?" || question === "What did I spend the most on?";
  return <View style={styles.answer}>
    <Label style={p.body}>{breakdown ? "Most of it went to housing, which took 28% of what you spent. Food and transport came next." : reduced ? "Eating out is your most flexible category. Trimming it by ₦15,000 a month would leave you with a bit more room each month." : food ? "In this sample statement, food spending was ₦92,000 — 17% of total spending." : "Live answers aren’t connected yet. The examples shown here use sample statement data."}</Label>
    {breakdown && <View style={{ marginTop: 16 }}><CategoryRows /></View>}
    {reduced && <View style={[p.card, { flexDirection: "row", gap: 9, marginTop: 16 }]}><View style={styles.savings}><DesignAsset name="send" width={16} /></View><View style={{ flex: 1 }}><Label style={{ fontSize: 16 }}>₦180,000</Label><Label style={[p.caption, { fontSize: 12, lineHeight: 16 }]}>Extra yearly savings if you reduce eating out by ₦15,000 a month</Label></View></View>}
    <Label style={{ fontSize: 12, color: "#48505B", marginTop: 16 }}>Based on the sample July 2026 statement</Label>
  </View>;
}
export function History() {
  const [search, setSearch] = useState(""); const [removed, setRemoved] = useState(false); const [confirm, setConfirm] = useState(false);
  const title = "Where did most of my money go?";
  return <AppScreen active="Ask" navigation={false} back={() => router.replace("/ask")}>
    <Label style={[p.heading, { marginTop: 38 }]}>Chat history</Label><Label style={p.caption}>Your past questions</Label><SampleDataNotice />
    <View style={[styles.composer, { backgroundColor: "#F3F5F6", borderWidth: 0, minHeight: 47 }]}><DesignAsset name="search" width={16} /><TextInput accessibilityLabel="Search your chats" placeholder="Search your chats..." placeholderTextColor="#A5ACB6" value={search} onChangeText={setSearch} style={styles.input} /></View>
    <Label style={{ fontSize: 12, marginTop: 24, marginBottom: 16 }}>TODAY</Label>
    {!removed && title.toLowerCase().includes(search.toLowerCase()) ? <View style={styles.history}><Pressable accessibilityRole="button" accessibilityLabel="Open sample conversation" onPress={() => router.push({ pathname: "/ask", params: { q: title } })} style={{ flex: 1 }}>
      <Label style={p.body}>{title}</Label><Label numberOfLines={2} style={[p.caption, { marginTop: 8 }]}>Most of it went to housing, which took 28% of what you spent. Food and...</Label><View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 }}><Label style={styles.month}>July 2026</Label><Label style={{ fontSize: 12 }}>2 questions</Label></View>
    </Pressable><Pressable accessibilityRole="button" accessibilityLabel="Remove sample conversation" hitSlop={8} onPress={() => setConfirm(true)}><DesignAsset name="historyTrash" width={20} /></Pressable></View> : <Label style={p.caption}>{removed ? "No conversations yet." : "No matching conversations."}</Label>}
    <AppSheet title="Remove conversation?" visible={confirm} onClose={() => setConfirm(false)}><Label style={p.body}>This removes the sample conversation from this screen.</Label><View style={{ marginTop: 20 }}><Link onPress={() => { setRemoved(true); setConfirm(false); }}>Remove sample conversation</Link></View></AppSheet>
  </AppScreen>;
}
const styles = StyleSheet.create({
  composer: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: "#ADDFFF", borderRadius: 40, backgroundColor: "#F9FAFB", paddingLeft: 21, paddingRight: 10 },
  input: { flex: 1, minWidth: 0, fontFamily: fonts.regular, fontSize: 14, color: C.ink, paddingVertical: 17 },
  send: { width: 40, height: 40, borderRadius: 24, backgroundColor: C.blue, alignItems: "center", justifyContent: "center" },
  question: { minHeight: 53, paddingHorizontal: 17, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: "#CBD0D7", flexDirection: "row", alignItems: "center", gap: 12 },
  user: { alignSelf: "flex-end", maxWidth: "92%", borderRadius: 24, borderBottomRightRadius: 5, backgroundColor: "#0A2D40", paddingHorizontal: 20, paddingVertical: 14 },
  answer: { padding: 20, backgroundColor: "#DCF1FE", borderRadius: 24, borderTopLeftRadius: 5 },
  suggestion: { paddingHorizontal: 18, paddingVertical: 13, borderRadius: 30, borderColor: "#ADDFFF", borderWidth: 1 },
  savings: { width: 30, height: 30, borderRadius: 20, backgroundColor: "#009666", justifyContent: "center", alignItems: "center" },
  history: { padding: 18, borderRadius: 20, borderWidth: 1, borderColor: "#CBD0D7", flexDirection: "row", gap: 14, alignItems: "center" },
  month: { fontSize: 12, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 20, backgroundColor: "#DCF1FE" },
});
