import { type ComponentRef, useRef, useState } from "react";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, C, fonts, Label } from "../components/ui";
import { LandingImage as Art } from "../components/LandingImage";
import type { LandingAssetName } from "../components/landingAssets";

const questions = [
  ["What is MoneyLens?", "MoneyLens is a personal finance insights platform that helps you understand your financial habits. It analyses your bank statements and turns your transactions into clear reports, spending breakdowns, and useful financial insights."],
  ["How does MoneyLens work?", "Upload a bank statement, review your transactions, and explore your money story. MoneyLens turns your statement into spending breakdowns and insights to help you understand your financial habits."],
  ["How do I upload my bank statement?", "Create an account, choose ‘Analyse my statement’ on your home screen, and select your bank statement as a PDF. You can review the transactions once your statement has been analysed."],
  ["Which bank statements does MoneyLens support?", "MoneyLens accepts PDF bank statements up to 20 MB. Statement layouts can vary by bank. If a file cannot be read, the app will let you know so you can try another statement."],
  ["Is my financial information safe with MoneyLens?", "You upload a statement without connecting your bank account or sharing your bank login. Your original uploaded file is deleted automatically after processing. See the privacy policy for more details about how your information is handled."],
  ["What kind of insights can I get from MoneyLens?", "Explore where your money goes, your income and spending breakdowns, recurring patterns, and your money story. You can also ask questions about an analysed statement."],
  ["Can I analyze statements from previous months?", "Yes. You can upload a statement from an earlier month and explore the transactions and spending patterns for that statement’s date range."],
] as const;

function Badge({ children, start = false }: { children: string; start?: boolean }) {
  return <View style={[s.badge, start && { alignSelf: "flex-start" }]}><Label style={s.badgeText}>{children}</Label></View>;
}

function Accent({ children, size = 40, start = false }: { children: string; size?: number; start?: boolean }) {
  return <View style={[s.accent, start && { alignSelf: "flex-start" }]}><Label style={[s.accentText, { fontSize: size, lineHeight: size * 1.15 }]}>{children}</Label></View>;
}

function NavLink({ title, onPress, light = false, strong = false }: { title: string; onPress: () => void; light?: boolean; strong?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress}
    style={({ pressed }) => [s.navLink, pressed && s.pressed]}>
    <Label style={[s.navText, light && { color: "white" }, strong && { fontSize: 18, fontFamily: fonts.bold }]}>{title}</Label>
  </Pressable>;
}

/** The three photographic device mockups retain Figma's original crop transforms. */
function HeroPhones({ width }: { width: number }) {
  const scale = width / 1235;
  const crop = (name: LandingAssetName, x: number, y: number, w: number, h: number,
    imageW: number, imageH: number, left: number, top: number) => (
    <View key={name} style={{ position: "absolute", left: x * scale, top: y * scale,
      width: w * scale, height: h * scale, overflow: "hidden" }}>
      <Art name={name} width={w * imageW * scale} height={h * imageH * scale}
        style={{ position: "absolute", left: w * left * scale, top: h * top * scale }} />
    </View>
  );
  return <View accessible accessibilityLabel="Money Lens app previews: upload a statement, see your money story, and review transactions"
    style={{ width, height: 713 * scale, overflow: "hidden" }}>
    {crop("Upload1", 0, 160, 388.092, 870, 4.2314, 1.4157, -1.0413, -0.0783)}
    {crop("Analysis21", 852, 141, 383, 865.58, 4.096, 1.3593, -2.105, -0.3)}
    {crop("Home1", 351, 0, 545.499, 1057.19, 3.3501, 1.2965, -1.1608, -0.1711)}
  </View>;
}

function Phone({ width, kind }: { width: number; kind: "upload" | "ask" }) {
  const scale = width / 396;
  const height = width * 821.677 / 396;
  const ask = kind === "ask";
  return <View accessible accessibilityLabel={ask ? "Ask MoneyLens: questions about your spending, habits, and saving" : "Upload your bank statement in the Money Lens app"}
    style={{ width, height }}>
    <View style={{ position: "absolute", top: height * 0.0192, left: width * 0.0398,
      width: width * 0.9204, height: height * 0.9616, borderRadius: 52 * scale, overflow: "hidden" }}>
      <Art name={ask ? "Screen14Pro1" : "Screen14Pro"} width={width * 0.9204} height={height * 0.9616} />
      <Label style={{ position: "absolute", top: 18 * scale, left: 42 * scale, fontSize: 15.766 * scale, fontFamily: fonts.bold }}>13:13</Label>
      <Art name={ask ? "Wifi1" : "Wifi"} width={16 * scale} height={12 * scale} style={{ position: "absolute", right: 62 * scale, top: 22 * scale }} />
      <Art name={ask ? "CellularConnection1" : "CellularConnection"} width={18 * scale} height={12 * scale} style={{ position: "absolute", right: 85 * scale, top: 22 * scale }} />
      <View style={{ position: "absolute", right: 32 * scale, top: 22 * scale, width: 23 * scale, height: 12 * scale,
        borderWidth: scale, borderColor: "#999", borderRadius: 4 * scale, padding: 2 * scale }}>
        <View style={{ flex: 1, backgroundColor: "black", borderRadius: 2 * scale }} />
        <Art name={ask ? "Cap1" : "Cap"} width={1.23 * scale} height={3.71 * scale} style={{ position: "absolute", right: -3 * scale, top: 3 * scale }} />
      </View>
      <View style={{ position: "absolute", bottom: 7 * scale, alignSelf: "center", width: 141 * scale,
        height: 4.64 * scale, backgroundColor: "black", borderRadius: 10 }} />
    </View>
    <View pointerEvents="none" style={{ position: "absolute", top: height * 0.032, left: width * 0.3501,
      width: width * 0.2928, height: height * 0.0414, borderRadius: 41 * scale, backgroundColor: "black" }} />
    <View pointerEvents="none" style={{ position: "absolute", top: height * 0.0192, left: width * 0.0398,
      width: width * 0.9204, height: height * 0.9616, borderRadius: 52 * scale, borderWidth: 11.13 * scale, borderColor: "black" }} />
    <View pointerEvents="none" style={{ position: "absolute", top: height * 0.0056, left: width * 0.0117,
      width: width * 0.9766, height: height * 0.9888, borderRadius: 62 * scale, borderWidth: 4.637 * scale, borderColor: "#B8AFE6" }} />
  </View>;
}

function UploadExample() {
  return <View style={s.uploadExample} accessible accessibilityLabel="Example: Bank Statement.PDF, 20 MB, upload completed">
    <View style={s.row}>
      <View style={{ width: 66, height: 55 }}>
        <Art name="Union" width={66} height={55} />
        <View style={s.folderPaper} />
        <LinearGradient colors={[C.blue, "#2789F5"]} style={s.folderFront} />
      </View>
      <View><Label style={{ fontSize: 16 }}>Bank Statement.PDF</Label><Label style={s.smallMuted}>20MB</Label></View>
    </View>
    <View style={s.completed}>
      <View style={[s.row, { justifyContent: "space-between" }]}>
        <View style={[s.row, { gap: 3 }]}><Art name="FluentDocumentCheckmark20Regular" width={20} height={20} /><Label style={{ fontSize: 14 }}>Completed</Label></View>
        <Art name="FluentDelete28Regular" width={18} height={18} />
      </View>
      <View style={s.progress} />
    </View>
    <View style={s.exampleButton}><Label style={s.exampleButtonText}>Analyse</Label></View>
  </View>;
}

function TransactionExample() {
  return <View style={s.transaction} accessible accessibilityLabel="Example transaction: Interswitch Ltd, income of 620,000 naira">
    <View style={[s.row, { justifyContent: "space-between", alignItems: "flex-start", gap: 6 }]}>
      <View style={{ gap: 5, flexShrink: 1 }}>
        <Label style={{ fontSize: 14 }}>Interswitch Ltd</Label>
        <Label style={{ fontSize: 10, color: "#808893" }}>INTERSWITCH PAYMENT 0701234567</Label>
        <View style={[s.row, { gap: 8 }]}><Label style={s.smallMuted}>1 Jul 2026</Label><Art name="Ellipse12" width={4} height={4} /><Label style={{ fontSize: 12, color: "#009666" }}>Money in</Label></View>
      </View>
      <View style={{ alignItems: "flex-end", gap: 10 }}><Label style={{ fontSize: 16, color: "#009666" }}>+₦620,000</Label><View style={s.incomeBadge}><Label style={{ fontSize: 12 }}>Income</Label></View></View>
    </View>
    <View style={s.divider} />
    <Label style={{ fontSize: 14, color: "#606976" }}>Is this your main salary or income?</Label>
    <View style={{ gap: 8, marginTop: 16 }}>
      <View style={s.incomeChoice}><Art name="GameIconsCheckMark" width={10} height={10} /><Label style={s.choiceText}>Yes, it’s my income</Label></View>
      <View style={s.incomeChoice}><Art name="SiLeftRightDuotone" width={11} height={11} /><Label style={s.choiceText}>It’s a transfer in</Label></View>
    </View>
  </View>;
}

function FolderQuestion({ question, answer, open, onPress, width }: {
  question: string; answer: string; open: boolean; onPress: () => void; width: number;
}) {
  const desktop = width >= 600;
  const [height, setHeight] = useState(open ? 261 : 101);
  const intrinsicHeight = open ? 261 : 101;
  return <View onLayout={e => setHeight(e.nativeEvent.layout.height)} style={{ width, paddingTop: 26 }}>
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
      <Art name={open ? "Subtract" : "Subtract1"} width={656} height={intrinsicHeight}
        style={{ transform: [{ scaleX: width / 656 }, { scaleY: height / intrinsicHeight }] }} />
    </View>
    <View style={[s.faqFolder, open && { paddingTop: desktop ? 24 : 20 }]}>
      {open && <View style={[s.answerPaper, { marginHorizontal: desktop ? 24 : 15 }]}>
        <Label style={{ fontSize: desktop ? 20 : 16, lineHeight: desktop ? 23 : 22 }}>{answer}</Label>
      </View>}
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} aria-expanded={open}
        accessibilityLabel={question} onPress={onPress}
        style={({ pressed }) => [s.question, { paddingHorizontal: desktop ? 24 : 18 }, pressed && s.pressed]}>
        <Label style={[s.questionText, { fontSize: desktop ? 20 : 16 }]}>{question}</Label>
        <Art name={open ? "F7Multiply" : "AkarIconsPlus1"} width={24} height={24} />
      </Pressable>
    </View>
  </View>;
}

function FooterBanner({ width }: { width: number }) {
  const k = width / 1320;
  const art = (name: LandingAssetName, x: number, y: number, w: number, h: number, rotate = "0deg") =>
    <Art key={name} name={name} width={w * k} height={h * k}
      style={{ position: "absolute", left: x * k, top: y * k, transform: [{ rotate }] }} />;
  return <View style={{ width, height: 533 * k, borderRadius: 20, overflow: "hidden" }}>
    <Art name="Frame2147226704" width={1320 * k} height={533 * k} fit="cover" style={StyleSheet.absoluteFill} />
    <View style={{ position: "absolute", left: 534 * k, top: 125 * k, gap: 0 }}>
      <Label style={[s.bannerText, { fontSize: 78.293 * k, lineHeight: 81 * k }]}>Your <Text style={s.bannerOutline}>Money</Text></Label>
      <Label style={[s.bannerText, { fontSize: 78.293 * k, lineHeight: 81 * k, marginLeft: 75 * k }]}>Your <Text style={s.bannerOutline}>Story</Text></Label>
      <View style={[s.row, { gap: 20 * k, marginLeft: 114 * k }]}>
        <Label style={[s.bannerText, { fontSize: 78.293 * k, lineHeight: 90 * k }]}>Your</Label>
        <View style={[s.accent, { padding: 10 * k, transform: [{ rotate: "-7.37deg" }] }]}><Label style={[s.accentText, { fontSize: 62 * k, lineHeight: 74 * k }]}>Clarity</Label></View>
      </View>
    </View>
    {art("BasilDocumentOutline1", 558, 264, 63, 63, "30.03deg")}
    {art("Group3", 977, 143, 51, 59, "30.03deg")}
    {art("Lens2", 1078, 245, 53, 52.177)}
    <View style={{ position: "absolute", left: 1054 * k, top: 320 * k, width: 263 * k, height: 223.3 * k, overflow: "hidden", transform: [{ rotate: "-6.78deg" }] }}>
      <Art name="7F8Cba42E3F6C6929C3827147A90485DRemovebgPreview1" width={450.2 * k} height={450.2 * k} style={{ position: "absolute", left: -91.84 * k, top: -109.84 * k }} />
    </View>
    {art("FreeIPhoneHandMockupMockuuupsStudio", -237, 16, 711, 660.862)}
    {art("C35584196A78239C897E6443B689A256RemovebgPreview1", -69, 397, 214, 214, "21.05deg")}
    {art("Ellipse33", 526, 61, 68, 68)}
    {art("Ellipse1", 578, 375, 79, 79)}
    {art("Ellipse135", 1016, 57, 75, 75)}
    {art("Ellipse117", 1123, 196, 75, 75)}
  </View>;
}

/** Public, responsive Money Lens landing page, shared by native and web. */
export function Landing() {
  const { width: windowWidth } = useWindowDimensions();
  const width = windowWidth;
  const desktop = width >= 900;
  // Backgrounds fill the viewport; reading widths and artwork scale independently.
  const contentWidth = desktop ? Math.min(width * 11 / 12, 2160) : width - 48;
  const gutter = (width - contentWidth) / 2;
  const wideScale = Math.max(0, Math.min(1, (width - 1440) / 1120));
  const artWidth = Math.min(width, 1920);
  const heroTitleSize = 48 + wideScale * 24;
  const web = Platform.OS === "web";
  const navWidth = Math.min(contentWidth, 663 + (web ? 100 : 0) + wideScale * 457);
  const cardPadding = desktop && width < 1200 ? 24 : 36;
  const cardTitleSize = desktop && width < 1100 ? 20 : 24 + wideScale * 4;
  const cardWidth = desktop ? (contentWidth - 48) / 3 : Math.min(contentWidth, 424);
  const cardHeight = 498 + wideScale * 100;
  const sectionTitle = desktop ? 40 + wideScale * 16 : Math.min(32, (width - 48) / 11);
  const bodySize = desktop ? 20 + wideScale * 2 : 20;
  const faqWidth = Math.min(contentWidth, 656 + wideScale * 184);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const sections = useRef<Record<string, number>>({});
  const [expanded, setExpanded] = useState<number | null>(0);
  const [notice, setNotice] = useState<string | null>(null);
  const go = (section: string) => scroll.current?.scrollTo({ y: sections.current[section] ?? 0, animated: true });
  const start = () => router.push({ pathname: "/auth", params: { step: "signup" } });
  const login = () => router.push({ pathname: "/auth", params: { step: "signin" } });
  const external = (url: string | undefined, title: string) => {
    if (!url) { setNotice(`${title} will be available here when Money Lens publishes its official link.`); return; }
    void Linking.openURL(url).catch(() => setNotice(`We couldn’t open ${title.toLowerCase()}. Please try again.`));
  };
  const deco = (name: LandingAssetName, x: number, y: number, w: number, h: number, rotate = "0deg") =>
    <Art key={`${name}-${x}`} name={name} width={w} height={h} style={{ position: "absolute", left: x, top: y, transform: [{ rotate }] }} />;

  return <SafeAreaView edges={["top", "bottom"]} style={s.page}>
    <ScrollView ref={scroll} style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator>
      <View style={{ width: "100%" }}>
        <LinearGradient colors={["#B9E3FE", "#B9E3FE", "#FFFFFF"]} locations={[0, 0.61, 1]}
          style={[s.hero, { paddingTop: desktop ? 32 : 20 }]}>
          <View style={[s.nav, { width: desktop ? navWidth : contentWidth }]}>
            <Pressable accessibilityRole="button" accessibilityLabel="Money Lens home" onPress={() => go("home")}>
              <Art name="MoneyLens1" width={120} height={25.856} label="Money Lens" />
            </Pressable>
            {desktop && <View style={[s.row, { gap: 45 }]}>
              <NavLink title="How it Works" onPress={() => go("how")} light strong />
              <NavLink title="Features" onPress={() => go("features")} light strong />
              <NavLink title="FAQ" onPress={() => go("faq")} light strong />
              {web && <NavLink title="Log In" onPress={login} light strong />}
            </View>}
            <View style={{ width: desktop ? 158 : 126 }}><Button title="Get Started" onPress={start} compact /></View>
          </View>
          {!desktop && <View style={[s.row, { justifyContent: "center", gap: 16, marginTop: 10 }]}>
            <NavLink title="How it Works" onPress={() => go("how")} />
            <NavLink title="Features" onPress={() => go("features")} />
            <NavLink title="FAQ" onPress={() => go("faq")} />
            {web && <NavLink title="Log In" onPress={login} />}
          </View>}
          <View style={[s.heroCopy, { marginTop: desktop ? 99 : 55, paddingHorizontal: desktop ? 0 : 20 }]}>
            <View style={s.socialProof}>
              <View style={s.avatars}>{(["Ellipse26", "Ellipse27", "Ellipse28", "Ellipse29"] as const).map((name, index) => <Art key={name} name={name} width={30} height={30} style={{ marginLeft: index ? -12.4 : 0 }} />)}</View>
              <Label style={{ fontSize: desktop ? 14 : 10 }}>Smarter Perspective On Your Financial Life</Label>
            </View>
            <Label role="heading" aria-level={1} style={[s.heroTitle, { fontSize: desktop ? heroTitleSize : Math.min(36, (width - 40) / 12), lineHeight: desktop ? heroTitleSize * 55 / 48 : 42 }]}>Your Money Has A Story</Label>
            <View style={[s.row, { gap: desktop ? 8 : 5, marginTop: 9 }]}>
              <Label style={[s.heroTitle, { marginTop: 0, fontSize: desktop ? heroTitleSize : Math.min(32, (width - 40) / 13), lineHeight: desktop ? heroTitleSize * 55 / 48 : 40 }]}>It’s Time To</Label>
              <Accent size={desktop ? heroTitleSize : Math.min(32, (width - 40) / 13)}>Understand It</Accent>
            </View>
            <Label style={[s.heroDescription, { maxWidth: 542 + wideScale * 178, fontSize: desktop ? 18 + wideScale * 4 : 16, lineHeight: desktop ? 21 + wideScale * 7 : 23 }]}>MoneyLens helps you make sense of your finances, understand where your money goes, discover patterns, and make more intentional financial decisions.</Label>
            <View style={{ width: 158, marginTop: 16 }}><Button title="Get Started" onPress={start} compact /></View>
          </View>
          {desktop && <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {deco("AkarIconsPlus", width * 0.22, 197, 53, 53, "30.03deg")}
            {deco("AkarIconsPlus", width * 0.875, 450, 53, 53, "30.03deg")}
            {deco("Group", width * 0.192, 492, 47.5, 48)}
            {deco("Group1", width * 0.291, 572, 30.3, 35.4, "30.03deg")}
            {deco("BasilDocumentOutline", width * 0.712, 568, 37.8, 37.8, "30.03deg")}
            {deco("Group2", width * 0.788, 230, 59, 62)}
          </View>}
          <View style={{ marginTop: desktop ? -10 : 48 }}><HeroPhones width={desktop ? artWidth * 1235 / 1440 : width * 1.18} /></View>
          <View pointerEvents="none" style={[s.heroFade, { height: desktop ? 180 : 90 }]}>
            <Art name="Ellipse30" width={width * 1.88} height={width * 0.4} style={{ position: "absolute", top: desktop ? -10 : -20, left: -width * 0.42 }} />
            <LinearGradient colors={["#FFFFFF00", "#FFFFFF", "#FFFFFF"]} style={StyleSheet.absoluteFill} />
          </View>
        </LinearGradient>

        <View style={[s.section, { paddingHorizontal: gutter, paddingTop: desktop ? 87 : 52, paddingBottom: desktop ? 82 : 48 }]}>
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Art name="Ellipse31" width={contentWidth * 1.4546} height={contentWidth * 1.4546} style={{ position: "absolute", left: (width - contentWidth * 1.4546) / 2, top: desktop ? 102 : 400 }} />
          </View>
          <Badge>ABOUT MONEYLENS</Badge>
          <Label style={[s.aboutText, { maxWidth: 1233 + wideScale * 367, marginTop: desktop ? 43 : 30, fontSize: desktop ? 40 + wideScale * 8 : 27, lineHeight: desktop ? 46 + wideScale * 12 : 35 }]}>
            MoneyLens makes understanding <Text style={s.muted}>your finances easier. by turning your bank statements into clear, meaningful insights, we help you uncover spending patterns, understand your financial habits, and make more intentional decisions about your money.</Text>
          </Label>
          <View style={[s.cards, { flexDirection: desktop ? "row" : "column", marginTop: desktop ? 104 : 40 }]}>
            <View style={[s.card, { width: cardWidth, height: cardHeight, padding: cardPadding }]}>
              <Art name="BasilDocumentSolid" width={32} height={32} />
              <Label role="heading" aria-level={2} style={[s.cardTitle, { fontSize: cardTitleSize, lineHeight: cardTitleSize * 1.15 }]}>Clarity Over Complexity</Label>
              <Label style={s.cardDescription}>Turn complicated bank statements into simple, easy-to-understand financial insights.</Label>
              <View style={[s.cardExample, { top: 214 + wideScale * 60, left: cardPadding, right: cardPadding }]}><UploadExample /></View>
            </View>
            <View style={[s.card, { width: cardWidth, height: cardHeight, padding: cardPadding }]}>
              <Art name="Frame2147226693" width={cardWidth} height={cardHeight} fit="cover" style={StyleSheet.absoluteFill} />
              <Art name="BoxiconsLightBulbAltFilled" width={32} height={32} />
              <Label role="heading" aria-level={2} style={[s.cardTitle, s.white, { fontSize: cardTitleSize, lineHeight: cardTitleSize * 1.15 }]}>Make Smarter Decisions</Label>
              <Label style={[s.cardDescription, s.white]}>Get meaningful insights and practical recommendations to help you build better financial habits.</Label>
            </View>
            <View style={[s.card, { width: cardWidth, height: cardHeight, padding: cardPadding }]}>
              <Art name="UixSolidHeartHealthyDiet" width={32} height={32} />
              <Label role="heading" aria-level={2} style={[s.cardTitle, { fontSize: cardTitleSize, lineHeight: cardTitleSize * 1.15 }]}>Understand Your Habits</Label>
              <Label style={s.cardDescription}>Discover spending patterns, identify where your money goes, and understand your financial behaviour.</Label>
              <View style={[s.cardExample, { top: 214 + wideScale * 60, left: cardPadding, right: cardPadding }]}><TransactionExample /></View>
            </View>
          </View>
        </View>

        <View onLayout={e => { sections.current.how = e.nativeEvent.layout.y; }}
          style={[s.section, { paddingHorizontal: gutter, paddingTop: desktop ? 134 : 60, paddingBottom: desktop ? 119 : 64 }]}>
          <Art name="Ellipse32" width={width * 1.333} height={width * 1.333} style={{ position: "absolute", top: -width * 1.031, left: -width / 6 }} />
          <View style={[s.howHeader, { flexDirection: desktop ? "row" : "column", gap: desktop ? 70 : 32 }]}>
            <View style={{ flex: desktop ? 1 : undefined, alignItems: "flex-start" }}>
              <Badge start>HOW IT WORKS</Badge>
              <Label role="heading" style={[s.sectionTitle, { fontSize: sectionTitle, lineHeight: sectionTitle * 1.15, marginTop: 20 }]}>Turn Financial Data Into</Label>
              <Accent size={sectionTitle} start>Meaningful Direction</Accent>
            </View>
            <Label style={[s.howDescription, { flex: desktop ? 1 : undefined, maxWidth: desktop ? 800 : undefined, fontSize: bodySize, lineHeight: bodySize * 1.3, marginTop: desktop ? 80 : 0 }]}>MoneyLens turns your bank statements into meaningful insights, helping you see where your money goes, understand your spending habits, and make better financial decisions.</Label>
          </View>
          <View style={[s.howBody, { flexDirection: desktop ? "row" : "column", marginTop: desktop ? 106 : 48, gap: desktop ? 80 : 44 }]}>
            <View style={{ flex: desktop ? 1 : undefined, alignItems: "center" }}><Phone kind="upload" width={desktop ? Math.min(396 + wideScale * 100, contentWidth * 0.35) : Math.min(300, contentWidth * 0.85)} /></View>
            <View style={[s.step, { flex: desktop ? 1 : undefined, maxWidth: desktop ? 800 : undefined }]}>
              <View style={[s.row, { alignItems: "flex-start", gap: 16 }]}><Label style={[s.stepTitle, { color: C.blue }]}>01</Label><Label role="heading" style={[s.stepTitle, { flex: 1, fontSize: desktop ? 32 : 25 }]}>Upload Your Bank Statement</Label></View>
              <Label style={[s.stepDescription, { fontSize: bodySize, lineHeight: bodySize * 1.3 }]}>Upload your bank statement securely in a supported format, and let MoneyLens take care of the rest. You don’t need to manually enter your transactions or spend time sorting through pages of financial records. Simply provide your statement to get started.</Label>
            </View>
          </View>
        </View>

        <View onLayout={e => { sections.current.features = e.nativeEvent.layout.y; }}
          style={[s.section, { paddingTop: desktop ? 98 : 60, paddingBottom: desktop ? 107 : 64 }]}>
          <Art name="Ellipse32" width={width * 1.333} height={width * 1.333} style={{ position: "absolute", top: -width * 1.031, left: -width / 6 }} />
          <Badge>AI FEATURES</Badge>
          <Label role="heading" style={[s.sectionTitle, { fontSize: sectionTitle, lineHeight: sectionTitle * 1.15, marginTop: 22 }]}>Everything You Need To</Label>
          <Accent size={sectionTitle}>Understand Your Money</Accent>
          <View style={{ width, alignItems: "center", marginTop: desktop ? 106 : 58 }}>
            <View pointerEvents="none" style={{ position: "absolute", top: desktop ? 301 + wideScale * 100 : 195, flexDirection: "row", alignItems: "center", gap: artWidth * 53 / 1440 }}>
              <Art name="Lens1" width={artWidth * 171 / 1440} height={artWidth * 168.344 / 1440} />
              <Art name="MoneyLens1" width={artWidth * 778.122 / 1440} height={artWidth * 167.656 / 1440} style={{ opacity: 0.4 }} />
            </View>
            <Phone kind="ask" width={desktop ? 452 + wideScale * 108 : Math.min(300, contentWidth * 0.85)} />
          </View>
        </View>

        <View onLayout={e => { sections.current.faq = e.nativeEvent.layout.y; }}
          style={[s.section, { paddingTop: desktop ? 109 : 60, paddingBottom: desktop ? 100 : 60, paddingHorizontal: gutter }]}>
          <Art name="Ellipse32" width={width * 1.333} height={width * 1.333} style={{ position: "absolute", top: -width * 1.031, left: -width / 6 }} />
          <Badge>FAQ</Badge>
          <Label role="heading" style={[s.sectionTitle, { fontSize: sectionTitle, lineHeight: sectionTitle * 1.15, marginTop: 11 }]}>Frequently Asked</Label>
          <Accent size={sectionTitle}>Questions</Accent>
          <View style={{ gap: desktop ? 40 : 22, marginTop: desktop ? 87 : 45 }}>
            {questions.map(([question, answer], index) => <FolderQuestion key={question} question={question} answer={answer}
              width={faqWidth} open={expanded === index} onPress={() => setExpanded(expanded === index ? null : index)} />)}
          </View>
        </View>

        <View style={[s.footer, { paddingHorizontal: gutter, paddingTop: 31 }]}>
          <FooterBanner width={contentWidth} />
          <View style={[s.footerNav, { flexDirection: desktop ? "row" : "column", gap: desktop ? 30 : 22 }]}>
            <View style={[s.row, { gap: 8 }]}><Art name="Lens3" width={31.568} height={31.078} /><Label style={s.footerBrand}>Money Lens</Label></View>
            <View style={[s.row, { gap: 22 }]}><NavLink title="Home" onPress={() => go("home")} light /><NavLink title="How it Works" onPress={() => go("how")} light /><NavLink title="Features" onPress={() => go("features")} light /></View>
            <View style={[s.row, { gap: 20 }]}>
              {([ ["LineMdInstagram", "Instagram", process.env.EXPO_PUBLIC_INSTAGRAM_URL], ["Group5", "X", process.env.EXPO_PUBLIC_X_URL], ["IcRoundFacebook", "Facebook", process.env.EXPO_PUBLIC_FACEBOOK_URL] ] as const).map(([asset, title, url]) => <Pressable key={title} accessibilityRole="link" accessibilityLabel={title} onPress={() => external(url, title)} style={s.socialLink}><Art name={asset} width={28} height={28} /></Pressable>)}
            </View>
          </View>
          <Art name="Line9" width={contentWidth} height={1} />
          <View style={[s.footerBottom, { flexDirection: desktop ? "row" : "column", gap: 18 }]}>
            <Label style={{ color: "white", fontSize: 14 }}>© 2026 Money Lens. All rights reserved.</Label>
            <View style={[s.row, { gap: desktop ? 65 : 24 }]}>
              <NavLink title="Privacy Policy" onPress={() => external(process.env.EXPO_PUBLIC_PRIVACY_URL, "Privacy Policy")} light />
              <NavLink title="Terms & Conditions" onPress={() => external(process.env.EXPO_PUBLIC_TERMS_URL, "Terms & Conditions")} light />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
    <Modal visible={!!notice} transparent animationType="fade" onRequestClose={() => setNotice(null)}>
      <View style={s.modalBackdrop}><View accessibilityViewIsModal style={s.modalCard}>
        <Label role="heading" style={{ fontSize: 24, fontFamily: fonts.bold }}>Stay connected</Label>
        <Label style={{ fontSize: 16, lineHeight: 24, marginVertical: 24 }}>{notice}</Label>
        <Button title="Got it" onPress={() => setNotice(null)} compact />
      </View></View>
    </Modal>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#B9E3FE" },
  scroll: { flex: 1, backgroundColor: "white" },
  scrollContent: { flexGrow: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 15 },
  white: { color: "white" },
  muted: { color: C.muted },
  pressed: { opacity: 0.7 },
  hero: { alignItems: "center", overflow: "hidden" },
  nav: { minHeight: 71, paddingLeft: 16, paddingRight: 8, paddingVertical: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 100, backgroundColor: "#FFFFFF1A", borderWidth: 1, borderColor: "#FFFFFF70" },
  navLink: { minHeight: 44, justifyContent: "center" },
  navText: { fontSize: 16, fontFamily: fonts.regular },
  heroCopy: { alignItems: "center" },
  socialProof: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "white", borderRadius: 100, paddingLeft: 4, paddingRight: 10, height: 38 },
  avatars: { flexDirection: "row" },
  heroTitle: { fontFamily: fonts.bold, textAlign: "center", marginTop: 16 },
  heroDescription: { fontFamily: "Aeonik-Light", textAlign: "center", marginTop: 20 },
  heroFade: { position: "absolute", bottom: -1, left: 0, right: 0 },
  section: { alignItems: "center", backgroundColor: "white", overflow: "hidden" },
  sectionGlow: { position: "absolute", top: 0, left: 0, right: 0, height: 250 },
  badge: { alignSelf: "center", backgroundColor: C.blue, borderRadius: 100, paddingHorizontal: 20, height: 38, justifyContent: "center" },
  badgeText: { color: "white", fontSize: 14 },
  accent: { backgroundColor: C.blue, paddingHorizontal: 10, paddingVertical: 7, transform: [{ rotate: "-2.73deg" }], alignSelf: "center" },
  accentText: { color: "white", fontFamily: fonts.bold },
  sectionTitle: { fontFamily: fonts.bold, textAlign: "center" },
  aboutText: { fontFamily: fonts.bold, textAlign: "center", maxWidth: 1233 },
  cards: { gap: 24, alignItems: "center", width: "100%" },
  card: { height: 498, borderRadius: 20, backgroundColor: "white", overflow: "hidden", padding: 36, alignSelf: "center" },
  cardTitle: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 27, marginTop: 16 },
  cardDescription: { fontSize: 16, lineHeight: 18, color: C.muted, marginTop: 16 },
  cardExample: { position: "absolute", top: 214, left: 36, right: 36 },
  uploadExample: { backgroundColor: "#F3F5F6", borderWidth: 1, borderColor: "#E5E8EB", padding: 20, paddingTop: 27, borderRadius: 32, gap: 21 },
  folderPaper: { position: "absolute", width: 52.35, height: 45.46, left: 6.2, top: 8.95, backgroundColor: "#D9D9D9", borderRadius: 6 },
  folderFront: { position: "absolute", top: 13.78, left: 0, width: 66, height: 40.64, borderRadius: 12 },
  smallMuted: { fontSize: 12, color: "#A5ACB6" },
  completed: { paddingHorizontal: 19, paddingVertical: 12, backgroundColor: "#E5E8EB", borderRadius: 15, gap: 10 },
  progress: { height: 5, borderRadius: 7, backgroundColor: C.blue },
  exampleButton: { backgroundColor: C.blue, paddingVertical: 16, alignItems: "center", borderRadius: 29 },
  exampleButtonText: { fontSize: 12, color: "white" },
  transaction: { backgroundColor: "white", borderRadius: 15, paddingHorizontal: 13, paddingVertical: 18, borderTopWidth: 3, borderTopColor: "#D82818", boxShadow: "0px 0px 20px rgba(0,0,0,0.08)" },
  incomeBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: "#FFF1F0" },
  divider: { height: 1, backgroundColor: "#D9D9D9", marginVertical: 12 },
  incomeChoice: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 25, borderWidth: 1, borderColor: "#FEDFDC", backgroundColor: "#FFF1F0" },
  choiceText: { color: "#F76255", fontSize: 12 },
  howHeader: { width: "100%", alignItems: "flex-start", justifyContent: "space-between" },
  howDescription: { fontSize: 20, lineHeight: 23, color: C.muted },
  howBody: { alignItems: "center", width: "100%" },
  step: { borderBottomWidth: 1, borderBottomColor: "#D6D6D6", paddingBottom: 54 },
  stepTitle: { fontSize: 32, lineHeight: 36, fontFamily: fonts.bold },
  stepDescription: { fontSize: 20, lineHeight: 23, color: C.muted, marginTop: 32 },
  faqFolder: { borderBottomLeftRadius: 15, borderBottomRightRadius: 15, overflow: "hidden" },
  answerPaper: { backgroundColor: "white", padding: 24, borderRadius: 10, transform: [{ rotate: "-1.13deg" }], marginBottom: -3 },
  question: { flexDirection: "row", gap: 16, minHeight: 75, alignItems: "center", justifyContent: "space-between", paddingVertical: 20, borderTopWidth: 1.5, borderTopColor: "black", backgroundColor: C.blue },
  questionText: { fontFamily: fonts.bold, color: "white", flex: 1 },
  footer: { backgroundColor: "#111111", overflow: "hidden" },
  footerNav: { justifyContent: "space-between", alignItems: "center", marginTop: 30, marginBottom: 25 },
  footerBrand: { fontFamily: fonts.bold, color: "white", fontSize: 24 },
  socialLink: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  footerBottom: { justifyContent: "space-between", alignItems: "center", paddingTop: 15, paddingBottom: 25 },
  bannerText: { fontFamily: fonts.bold, letterSpacing: -2 },
  bannerOutline: { color: C.blue, fontStyle: "italic", fontFamily: fonts.bold, textShadowColor: "white", textShadowRadius: 2, textShadowOffset: { width: 2, height: 1 } },
  modalBackdrop: { flex: 1, backgroundColor: "#00000080", alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { backgroundColor: "white", borderRadius: 24, padding: 28, width: "100%", maxWidth: 420 },
});
