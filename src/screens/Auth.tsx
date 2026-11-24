import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, TextInput, View } from "react-native";
import {
  Button,
  C,
  ErrorNote,
  Field,
  fonts,
  Illustration,
  Label,
  Legal,
  Link,
  s,
  Screen,
  useReducedMotion,
  useHardwareBack,
} from "../components/ui";
import { Challenge, messageFor, Purpose, session } from "../lib/api";
import { Tokens } from "../lib/session";
import { passwordError, validEmail } from "../lib/validation";
import { DesignAsset } from "../components/DesignAsset";
import { SocialButtons } from "./Onboarding";
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro resolves bundled images from static require calls.
const moneyStory = require("../../assets/money-story.png");
export type AuthRoute =
  "signin" | "signup" | "reset" | "code" | "password" | "name";
export function Auth({
  initial,
  onBack,
  showSignInLink = false,
}: {
  initial: AuthRoute;
  onBack: () => void;
  showSignInLink?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const params = useLocalSearchParams<{ step?: string; notice?: string }>();
  const requested = params.step;
  const setRoute = (step: AuthRoute) => router.setParams({ step });
  const [purpose, setPurpose] = useState<Purpose>("registration");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [firstName, setFirstName] = useState("");
  const [code, setCode] = useState("");
  const [codeFocused, setCodeFocused] = useState(false);
  const [remember, setRemember] = useState(true);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [grant, setGrant] = useState("");
  const [resendAt, setResendAt] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const allowed = ["signin", "signup", "reset", "code", "password"];
  let route: AuthRoute =
    initial === "name"
      ? "name"
      : requested && allowed.includes(requested)
        ? (requested as AuthRoute)
        : initial;
  if (
    (route === "code" && !challenge) ||
    (route === "password" && !grant && !success)
  )
    route = "signup";

  useEffect(() => {
    const timer = setInterval(
      () =>
        setRemaining(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000))),
      1000,
    );
    return () => clearInterval(timer);
  }, [resendAt]);
  const move = (next: AuthRoute) => {
    setError("");
    setRoute(next);
    setPassword("");
    setConfirm("");
  };
  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(messageFor(e));
    } finally {
      setBusy(false);
    }
  };
  const requestCode = async (p: Purpose) => {
    if (!validEmail(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    await run(async () => {
      const next = await session.publicRequest<Challenge>(
        "/auth/email/request-code",
        { email: email.trim().toLowerCase(), purpose: p },
      );
      setPurpose(p);
      setChallenge(next);
      setCode("");
      setGrant("");
      setResendAt(Date.now() + next.resendAfter * 1000);
      setRemaining(next.resendAfter);
      move("code");
    });
  };
  const back = () => {
    if (busy) return;
    if (route === "name") {
      void run(async () => {
        await session.logout();
        onBack();
      });
      return;
    }
    if (route === "code") move(purpose === "registration" ? "signup" : "reset");
    else if (route === "password") {
      setGrant("");
      setCode("");
      move("code");
    } else if (route === "reset") move("signin");
    else onBack();
  };
  useHardwareBack(back);
  if (route === "signin")
    return (
      <Screen back={back}>
        <View style={{ height: 27 }} />
        <Label style={[s.title, { fontSize: 24, lineHeight: 24 }]}>Welcome back to your</Label>
        <Image
          source={moneyStory}
          accessibilityLabel="Money Story!"
          style={{ width: 157, height: 28, marginTop: 8 }}
          resizeMode="contain"
        />
        <Label style={[s.subtitle, { fontSize: 12, lineHeight: 14, marginBottom: 24 }]}>
          Sign in to revisit your insights and see what your money is telling
          you.
        </Label>
        <Field
          label="Email Address"
          accessibilityLabel="Email address"
          icon="email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <Field
          label="Password"
          icon="lock"
          password
          placeholder="Min. 12 characters"
          value={password}
          onChangeText={setPassword}
          autoComplete="current-password"
        />
        <View style={styles.row}>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: remember }}
            onPress={() => setRemember(!remember)}
            style={styles.checkRow}
          >
            <View
              style={[
                styles.checkbox,
                remember && { backgroundColor: C.blue, borderColor: C.blue },
              ]}
            >
              {remember && (
                <Label style={{ color: "white", fontSize: 11 }}>✓</Label>
              )}
            </View>
            <Label style={{ fontSize: 14 }}>Remember me</Label>
          </Pressable>
          <Link onPress={() => move("reset")}>Forgot password?</Link>
        </View>
        <ErrorNote message={error || (params.notice === "logout_unconfirmed" ? "Signed out on this device. We couldn’t confirm sign-out with the server." : "")} />
        <View style={{ marginTop: 22 }}>
          <Button
            title="Continue"
            loading={busy}
            disabled={!validEmail(email.trim()) || password.length < 12}
            onPress={() =>
              void run(async () => {
                const tokens = await session.publicRequest<Tokens>(
                  "/auth/login",
                  { email: email.trim().toLowerCase(), password },
                );
                await session.establish(tokens, remember);
              })
            }
          />
        </View>
        <View style={styles.divider}>
          <View style={styles.line} />
          <Label style={{ fontSize: 11 }}>OR</Label>
          <View style={styles.line} />
        </View>
        <SocialButtons />
        <View style={styles.bottomLink}>
          <Label style={{ fontSize: 14 }}>Don’t have an account?</Label>
          <Link onPress={() => move("signup")}>Sign Up</Link>
        </View>
      </Screen>
    );
  if (route === "signup" || route === "reset")
    return (
      <Screen
        back={back}
        footer={
          <>
            <Button
              title="Continue"
              loading={busy}
              disabled={!validEmail(email.trim())}
              onPress={() =>
                void requestCode(
                  route === "signup" ? "registration" : "password_reset",
                )
              }
            />
            {route === "signup" && (
              <View style={{ alignItems: "center", marginTop: 16 }}>
                <Label
                  style={{ fontSize: 12, color: C.muted, textAlign: "center" }}
                >
                  By continuing, you’re accepting our
                </Label>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 4,
                    flexWrap: "wrap",
                    justifyContent: "center",
                    marginTop: 3,
                  }}
                >
                  <Legal kind="terms" />
                  <Label style={{ fontSize: 11, color: C.muted }}>and</Label>
                  <Legal kind="privacy" />
                </View>
                {showSignInLink && <View style={styles.bottomLink}>
                  <Label style={{ fontSize: 14 }}>Already have an account?</Label>
                  <Link onPress={() => move("signin")}>Sign In</Link>
                </View>}
              </View>
            )}
          </>
        }
      >
        <Illustration kind="email" />
        {route === "signup" ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 4 }}>
            <Label style={s.title}>Hello!</Label>
            <DesignAsset name="financialClarity" width={157} height={25} label="Financial Clarity" />
            <Label style={s.title}>Starts Here.</Label>
          </View>
        ) : <Label style={[s.title, s.center]}>Reset your password</Label>}
        <Label style={[s.subtitle, s.center]}>
          {route === "signup"
            ? "Enter your email to continue."
            : "Enter the email address associated with your Money Lens account."}
        </Label>
        <Field
          icon="email"
          placeholder="you@example.com"
          accessibilityLabel="Email address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          style={{ borderColor: C.blue }}
        />
        <ErrorNote message={error} />
      </Screen>
    );
  if (route === "code")
    return (
      <Screen
        back={back}
        footer={
          <Button
            title="Continue"
            loading={busy}
            disabled={code.length !== 6}
            onPress={() =>
              void run(async () => {
                const result = await session.publicRequest<{ grant: string }>(
                  "/auth/email/verify-code",
                  {
                    email: email.trim().toLowerCase(),
                    purpose,
                    challengeId: challenge?.challengeId,
                    code,
                  },
                );
                setGrant(result.grant);
                move("password");
              })
            }
          />
        }
      >
        <Illustration kind="code" />
        <Label style={[s.title, s.center]}>Enter your code</Label>
        <Label style={[s.subtitle, s.center]}>
          If this email is eligible, we sent a 6-digit code to{"\n"}
          {email.trim()}.
        </Label>
        <View style={styles.codeEntry}>
          <View pointerEvents="none" accessible={false} style={styles.codeGroups}>
            {[0, 1].map(group => (
              <View key={group} style={[styles.codeGroup,
                codeFocused && (code.length < 3 ? group === 0 : group === 1) && { borderColor: C.blue }]}>
                <Label style={styles.codeDigits}>{code.slice(group * 3, group * 3 + 3)}<Label style={[styles.codeDigits, { color: "#C5C5C5" }]}>{"0".repeat(3 - code.slice(group * 3, group * 3 + 3).length)}</Label></Label>
              </View>
            ))}
          </View>
          <TextInput
            accessibilityLabel="Six-digit verification code"
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            value={code}
            onChangeText={value => setCode(value.replace(/\D/g, "").slice(0, 6))}
            onFocus={() => setCodeFocused(true)}
            onBlur={() => setCodeFocused(false)}
            caretHidden
            style={styles.codeInput}
          />
        </View>
        <View style={styles.bottomLink}>
          <Label style={{ fontSize: 12, color: C.muted }}>
            Didn’t receive a code?
          </Label>
          {remaining ? (
            <Label style={{ fontSize: 12, color: C.muted }}>
              Resend in {remaining}s
            </Label>
          ) : (
            <Link onPress={() => void requestCode(purpose)}>Resend</Link>
          )}
        </View>
        <ErrorNote message={error} />
      </Screen>
    );
  if (route === "password")
    return (
      <Screen
        back={back}
        footer={
          <Button
            title="Continue"
            loading={busy}
            disabled={!!passwordError(password, confirm)}
            onPress={() =>
              void run(async () => {
                const validation = passwordError(password, confirm);
                if (validation) {
                  setError(validation);
                  return;
                }
                if (purpose === "registration") {
                  const tokens = await session.publicRequest<Tokens>(
                    "/auth/register",
                    {
                      email: email.trim().toLowerCase(),
                      password,
                      registrationGrant: grant,
                    },
                  );
                  await session.establish(tokens, true);
                } else {
                  await session.publicRequest("/auth/password/reset", {
                    email: email.trim().toLowerCase(),
                    password,
                    grant,
                  });
                  setGrant("");
                  setPassword("");
                  setConfirm("");
                  setSuccess(true);
                }
              })
            }
          />
        }
      >
        <Illustration kind="lock" />
        <Label style={[s.title, s.center]}>
          {purpose === "registration"
            ? "Create a password"
            : "Create a new password"}
        </Label>
        <Label style={[s.subtitle, s.center]}>Keep your account secure.</Label>
        <Field
          label="Password"
          icon="lock"
          password
          placeholder="Min. 12 characters"
          value={password}
          onChangeText={setPassword}
          autoComplete="new-password"
          maxLength={128}
        />
        <Field
          label="Confirm password"
          icon="lock"
          password
          placeholder="Repeat your password"
          value={confirm}
          onChangeText={setConfirm}
          autoComplete="new-password"
          maxLength={128}
        />
        {confirm.length > 0 && password !== confirm && (
          <ErrorNote message="Your passwords don’t match." />
        )}
        <ErrorNote message={error} />
        <Modal
          transparent
          visible={success}
          animationType={reducedMotion ? "none" : "slide"}
          onRequestClose={() => {
            setSuccess(false);
            move("signin");
          }}
        >
          <View style={styles.scrim}>
            <View accessibilityViewIsModal style={styles.sheet}>
              <Illustration kind="success" />
              <Label style={[s.title, s.center, { fontSize: 24, lineHeight: 28 }]}>Password updated</Label>
              <Label style={[s.subtitle, s.center, { fontSize: 14, lineHeight: 16 }]}>
                Your password has been changed.{"\n"}You can now sign in to
                Money Lens.
              </Label>
              <Button
                title="Sign In"
                onPress={() => {
                  setSuccess(false);
                  move("signin");
                }}
              />
            </View>
          </View>
        </Modal>
      </Screen>
    );
  return (
    <Screen
      back={back}
      footer={
        <Button
          title="Continue"
          loading={busy}
          disabled={!firstName.trim()}
          onPress={() =>
            void run(async () => {
              await session.personalize(firstName.trim());
            })
          }
        />
      }
    >
      <Illustration kind="name" />
      <Label style={[s.title, s.center]}>What should we call you?</Label>
      <Label style={[s.subtitle, s.center]}>
        Your first name is all we need.
      </Label>
      <Field
        placeholder="e.g. Michael"
        accessibilityLabel="First name"
        value={firstName}
        onChangeText={setFirstName}
        autoComplete="given-name"
        maxLength={80}
        style={{ borderColor: C.blue }}
      />
      <Label style={{ color: C.muted, textAlign: "center", fontSize: 14 }}>
        This is used to personalize your money insights.
      </Label>
      <ErrorNote message={error} />
    </Screen>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 30,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: "#CADDE8",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginVertical: 24,
  },
  line: { flex: 1, height: 1, backgroundColor: C.line },
  bottomLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 16,
  },
  codeEntry: { width: 242, height: 66, alignSelf: "center" },
  codeGroups: { flexDirection: "row", gap: 8 },
  codeGroup: { width: 117, height: 66, borderRadius: 20, borderWidth: 3,
    borderColor: "transparent", backgroundColor: "#F9FAFB", alignItems: "center", justifyContent: "center" },
  codeDigits: { fontFamily: fonts.medium, fontSize: 40, lineHeight: 44, color: C.muted },
  codeInput: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, color: "transparent", fontSize: 40,
    backgroundColor: "transparent", borderWidth: 0, padding: 0 },
  scrim: { flex: 1, backgroundColor: "#000000A0", justifyContent: "flex-end" },
  sheet: {
    borderRadius: 50,
    backgroundColor: "white",
    padding: 16,
    paddingBottom: 16,
    width: "96%",
    maxWidth: 520,
    alignSelf: "center",
  },
});
