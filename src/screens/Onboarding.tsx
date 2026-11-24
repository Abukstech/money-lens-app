import React, { useRef, useState } from "react";
import {
  FlatList,
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { BlurTargetView, BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { DesignAsset } from "../components/DesignAsset";
import { fonts, Label, Link } from "../components/ui";
import { GoogleLogo } from "../components/GoogleLogo";
import { AppleLogo } from "../components/AppleLogo";
const slides = [
  {
    image: require("../../assets/figma/spendingPhoto.jpg"),
    title: "Track Your",
    accent: "Spending",
    art: "spendingTitle" as const,
    artWidth: 200,
    artHeight: 96,
    crop: { x: 0.2755768895, y: 0.9017094374, offsetX: 0.3622115552, offsetY: 0.0982905999 },
  },
  {
    image: require("../../assets/figma/moneyPhoto.jpg"),
    title: "Take Control Of",
    accent: "Your Money.",
    art: "moneyTitle" as const,
    artWidth: 290,
    artHeight: 99,
    crop: null,
  },
  {
    image: require("../../assets/figma/savingPhoto.jpg"),
    title: "Build Smart",
    accent: "Saving Habits",
    art: "savingTitle" as const,
    artWidth: 265,
    artHeight: 99,
    crop: { x: 0.5266789198, y: 0.7654045820, offsetX: 0.3042130470, offsetY: 0.2228060067 },
  },
];
export function SocialButtons() {
  return (
    <View style={{ gap: 8, width: "100%" }}>
      <View
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
        accessibilityState={{ disabled: true }}
        style={[styles.social, { backgroundColor: "#212121" }]}
      >
        <GoogleLogo />
        <Label style={{ color: "white", fontSize: 16 }}>
          Continue with Google
        </Label>
      </View>
      <View
        accessibilityRole="button"
        accessibilityLabel="Continue with Apple"
        accessibilityState={{ disabled: true }}
        style={[styles.social, { backgroundColor: "#F5F5F5" }]}
      >
        <AppleLogo />
        <Label style={{ color: "#212121", fontSize: 16 }}>
          Continue with Apple
        </Label>
      </View>
    </View>
  );
}
function Slide({
  item,
  width,
  height,
  page,
  active,
  onSignIn,
  onSignUp,
}: {
  item: (typeof slides)[number];
  width: number;
  height: number;
  page: number;
  active: boolean;
  onSignIn: () => void;
  onSignUp: () => void;
}) {
  const blurTarget = useRef<React.ComponentRef<typeof View>>(null);
  return (
    <View style={{ width, height, overflow: "hidden" }} accessibilityElementsHidden={!active} importantForAccessibility={active ? "auto" : "no-hide-descendants"}>
      <BlurTargetView ref={blurTarget} style={StyleSheet.absoluteFill}>
        <ImageBackground
          source={item.image}
          style={{ width, height }}
          imageStyle={item.crop ? {
            width: width / item.crop.x,
            height: (width * 844 / 390) / item.crop.y,
            left: -item.crop.offsetX * width / item.crop.x,
            top: -item.crop.offsetY * (width * 844 / 390) / item.crop.y + (height - width * 844 / 390) / 2,
          } : undefined}
          resizeMode={item.crop ? "stretch" : "cover"}
        >
          <LinearGradient
            colors={["#0000000D", "#0000000D"]}
            style={StyleSheet.absoluteFill}
          />
        </ImageBackground>
      </BlurTargetView>
      <SafeAreaView style={styles.safe}>
        <Pressable
          accessibilityRole="button"
          onPress={onSignIn}
          style={styles.skip}
        >
          <Label
            style={{ color: "white", fontFamily: fonts.italic, fontSize: 16 }}
          >
            Skip
          </Label>
        </Pressable>
        <View style={styles.cardOuter}>
          <BlurView
            blurTarget={blurTarget}
            blurMethod="dimezisBlurViewSdk31Plus"
            intensity={55}
            tint="light"
            style={styles.card}
          >
            <DesignAsset name={item.art} width={Math.min(item.artWidth, width - 96)} height={item.artHeight} label={`${item.title} ${item.accent}`} />
            <View
              accessibilityLabel={`Slide ${page + 1} of 3`}
              style={styles.dots}
            >
              {slides.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: page === i ? 6 : 5,
                    height: page === i ? 25 : 13,
                    borderRadius: 4,
                    backgroundColor: page === i ? "#263133" : "white",
                  }}
                />
              ))}
            </View>
            <SocialButtons />
            <View style={{ alignItems: "center", marginTop: 16 }}>
              <Link onPress={onSignUp} style={{ color: "white", fontSize: 16, textDecorationLine: "underline" }}>Continue with email</Link>
            </View>
            <View style={styles.signIn}>
              <Label style={{ color: "white", fontSize: 14 }}>
                Already have an account?
              </Label>
              <Link onPress={onSignIn}>Sign In</Link>
            </View>
          </BlurView>
        </View>
      </SafeAreaView>
    </View>
  );
}
export function Onboarding({
  onSignIn,
  onSignUp,
}: {
  onSignIn: () => void;
  onSignUp: () => void;
}) {
  const window = useWindowDimensions();
  const [webHeight, setWebHeight] = useState<number>();
  const width = Platform.OS === "web" ? Math.min(window.width, 520) : window.width;
  const height = Platform.OS === "web" ? (webHeight ?? window.height) : window.height;
  const [page, setPage] = useState(0);
  return (
    <View
      style={{ flex: 1 }}
      onLayout={Platform.OS === "web" ? (event) => setWebHeight(event.nativeEvent.layout.height) : undefined}
    >
      <StatusBar style="light" />
      <FlatList
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        data={slides}
        keyExtractor={(item) => item.accent}
        scrollEventThrottle={32}
        onScroll={(e) =>
          setPage(Math.max(0, Math.min(2, Math.round(e.nativeEvent.contentOffset.x / width))))
        }
        renderItem={({ item, index }) => (
          <Slide
            item={item}
            width={width}
            height={height}
            page={page}
            active={index === page}
            onSignIn={onSignIn}
            onSignUp={onSignUp}
          />
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 24, paddingBottom: 26 },
  skip: {
    alignSelf: "flex-end",
    marginTop: 10,
    paddingHorizontal: 17,
    paddingVertical: 8,
    borderRadius: 24,
    borderColor: "#FFFFFF70",
    borderWidth: 1,
    backgroundColor: "#FFFFFF15",
  },
  cardOuter: {
    marginTop: "auto",
    width: "100%",
    maxWidth: 410,
    alignSelf: "center",
    borderRadius: 50,
    overflow: "hidden",
  },
  card: { padding: 24, borderRadius: 50, overflow: "hidden", alignItems: "center", backgroundColor: "#FFFFFF26" },
  heading: {
    color: "white",
    fontFamily: fonts.bold,
    letterSpacing: -1.2,
    textAlign: "center",
    lineHeight: 39,
  },
  dots: {
    flexDirection: "row",
    gap: 2.75,
    height: 25,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  social: {
    borderRadius: 30,
    minHeight: 66,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  signIn: {
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
});
