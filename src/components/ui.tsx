import React, { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Image,
  BackHandler,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  StyleProp,
  ViewStyle,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { DesignAsset } from "./DesignAsset";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro resolves bundled images from static require calls.
const brandImage = require("../../assets/money-lens-logo.png");

export const C = {
  blue: "#1BA5FE",
  ink: "#000000",
  muted: "#737373",
  pale: "#DCF1FE",
  line: "#D9E7EF",
  white: "#FFFFFF",
  red: "#B93647",
};
export const fonts = {
  regular: "Aeonik-Regular",
  medium: "Aeonik-Regular",
  bold: "Aeonik-Bold",
  italic: "Aeonik-Bold",
};
export function Label({
  children,
  style,
  ...rest
}: React.ComponentProps<typeof Text>) {
  return (
    <Text {...rest} style={[s.text, style]}>
      {children}
    </Text>
  );
}
export function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  secondary = false,
  compact = false,
  trailing,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  secondary?: boolean;
  compact?: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.button,
        compact && { minHeight: 49, paddingVertical: 14 },
        secondary && s.secondary,
        (disabled || loading) && { opacity: 0.55 },
        pressed && { opacity: 0.8 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? C.blue : "white"} />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Label
          style={[
            s.buttonText,
            compact && { fontSize: 16 },
            secondary && { color: C.blue },
          ]}
        >
          {title}
        </Label>
        {trailing}
        </View>
      )}
    </Pressable>
  );
}
export function Link({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: React.ComponentProps<typeof Text>["style"];
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8}>
      <Label style={[{ color: C.blue, fontSize: 14 }, style]}>{children}</Label>
    </Pressable>
  );
}
export function Field({
  label,
  icon,
  password,
  style,
  ...props
}: TextInputProps & {
  label?: string;
  icon?: "email" | "lock";
  password?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 16 }}>
      {label && <Label style={s.fieldLabel}>{label}</Label>}
      <View style={[s.field, focused && { borderColor: C.blue }, style]}>
        {icon && <Icon name={icon} size={20} color={C.muted} />}
        <TextInput
          {...props}
          accessibilityLabel={
            props.accessibilityLabel ?? label ?? props.placeholder
          }
          secureTextEntry={password && !visible}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          placeholderTextColor={C.muted}
          style={s.input}
        />
        {password && (
          <Pressable
            onPress={() => setVisible(!visible)}
            accessibilityRole="button"
            accessibilityLabel={visible ? "Hide password" : "Show password"}
            hitSlop={10}
          >
            <Icon name="eye" size={25} color={C.muted} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
export function Screen({
  children,
  back,
  footer,
  dock,
  dockStyle,
  header,
  contentStyle,
  scrollRef,
  onContentSizeChange,
  colors = ["#FFFFFF", "#DCF1FE"],
}: {
  children: React.ReactNode;
  back?: () => void;
  footer?: React.ReactNode;
  dock?: React.ReactNode;
  dockStyle?: StyleProp<ViewStyle>;
  header?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  scrollRef?: React.Ref<React.ComponentRef<typeof ScrollView>>;
  onContentSizeChange?: (width: number, height: number) => void;
  colors?: readonly [string, string, ...string[]];
}) {
  return (
    <LinearGradient colors={colors} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            ref={scrollRef}
            onContentSizeChange={onContentSizeChange}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[s.screen, contentStyle]}
            showsVerticalScrollIndicator={false}
          >
            {header ? (
              <View style={{ minHeight: 40, justifyContent: "center" }}>
                {back && (
                  <BackButton onPress={back} />
                )}
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    alignItems: "center",
                  }}
                >
                  {header}
                </View>
              </View>
            ) : (
              back && (
                <BackButton onPress={back} />
              )
            )}
            {children}
            {footer && <View style={s.footer}>{footer}</View>}
          </ScrollView>
          {dock && (
            <View
              style={[{
                width: "100%",
                maxWidth: 520,
                alignSelf: "center",
                paddingHorizontal: 44,
                paddingBottom: 20,
                paddingTop: 10,
              }, dockStyle]}
            >
              {dock}
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
export function ErrorNote({ message }: { message?: string }) {
  return message ? (
    <Label accessibilityRole="alert" style={s.error}>
      {message}
    </Label>
  ) : null;
}
export function Brand({
  small = false,
}: {
  small?: boolean;
  fallback?: boolean;
}) {
  return (
    <Image
      accessibilityLabel="Money Lens"
      source={brandImage}
      resizeMode="contain"
      style={{
        width: small ? 161 : 230,
        height: small ? 35 : 50,
      }}
    />
  );
}
export function BackButton({ onPress }: { onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onPress}
    hitSlop={12} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
    <DesignAsset name="back" width={16} /><Label style={{ color: C.blue, fontSize: 16 }}>Back</Label>
  </Pressable>;
}

export function Illustration({ kind }: {
  kind: "email" | "code" | "lock" | "name" | "success" | "error" | "analysing";
}) {
  const dimensions = { email: [138, 138], code: [174, 174], lock: [143, 143],
    name: [186, 186], success: [156, 156], error: [159, 159], analysing: [203, 142] };
  const [width, height] = dimensions[kind];
  return <View style={s.illustration}><DesignAsset name={kind} width={width} height={height} /></View>;
}
export function Icon({
  name,
  size = 24,
  color = C.ink,
}: {
  name:
    | "email"
    | "lock"
    | "eye"
    | "folder"
    | "arrow"
    | "user"
    | "close"
    | "check"
    | "file";
  size?: number;
  color?: string;
}) {
  const asset = { email: "mail", lock: "padlock", eye: "eye", arrow: "arrow", folder: "folder" } as const;
  if (name in asset) {
    const key = asset[name as keyof typeof asset];
    return <DesignAsset name={key} width={size} height={name === "eye" ? size * 0.8 : size} />;
  }
  const paths = {
    email: "M3 5h18v14H3z M3 6l9 7 9-7",
    lock: "M7 10V7a5 5 0 0110 0v3 M5 10h14v11H5z M12 14v3",
    eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M15 12a3 3 0 11-6 0 3 3 0 016 0",
    folder: "M2 7h20v14H2z M2 7V3h7l3 4",
    arrow: "M4 12h15 M13 6l6 6-6 6",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0 M4 22v-3a8 8 0 0116 0v3",
    close: "M6 6l12 12 M18 6L6 18",
    check: "M4 12l5 5L20 6",
    file: "M5 2h9l5 5v15H5z M14 2v6h5 M8 12h8 M8 16h8",
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={paths[name]}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
export function Legal({ kind }: { kind: "terms" | "privacy" }) {
  const url =
    kind === "terms"
      ? process.env.EXPO_PUBLIC_TERMS_URL
      : process.env.EXPO_PUBLIC_PRIVACY_URL;
  return (
    <Label
      style={{
        fontSize: 11,
        color: url ? C.ink : C.muted,
        textDecorationLine: url ? "underline" : "none",
      }}
      onPress={
        url
          ? () => {
              void Linking.openURL(url);
            }
          : undefined
      }
    >
      {kind === "terms" ? "Terms & Conditions" : "Privacy Policy"}
      {!url ? " (coming soon)" : ""}
    </Label>
  );
}
export const s = StyleSheet.create({
  text: { fontFamily: fonts.regular, color: C.ink, fontSize: 15 },
  screen: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 20,
    paddingBottom: 22,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.3,
    color: C.ink,
  },
  subtitle: {
    color: C.muted,
    fontSize: 16,
    lineHeight: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  center: { textAlign: "center" },
  footer: { marginTop: "auto", paddingTop: 36 },
  button: {
    backgroundColor: C.blue,
    borderRadius: 30,
    minHeight: 67,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  buttonText: { color: "white", fontFamily: fonts.medium, fontSize: 16 },
  secondary: { backgroundColor: "#E4F5FF" },
  field: {
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 28,
    backgroundColor: "#F9FAFB",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    minHeight: 52,
    gap: 8,
  },
  fieldLabel: { fontSize: 16, marginBottom: 8 },
  input: {
    flex: 1,
    color: C.ink,
    fontFamily: fonts.regular,
    fontSize: 14,
    paddingVertical: 14,
    minWidth: 0,
  },
  illustration: { alignItems: "center", justifyContent: "center", height: 180, marginTop: 24 },
  error: { color: C.red, fontSize: 13, lineHeight: 19, marginVertical: 12 },
});

export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    return () => subscription.remove();
  }, []);
  return reduced;
}

export function useHardwareBack(onBack: () => boolean | void) {
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        return onBack() !== false;
      },
    );
    return () => subscription.remove();
  }, [onBack]);
}
