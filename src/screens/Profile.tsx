import { useEffect, useRef, useState } from "react";
import { Linking, Pressable, StyleSheet, Switch, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { DesignAsset } from "../components/DesignAsset";
import { Button, C, ErrorNote, Field, Label } from "../components/ui";
import { AccountAvatar, p, AppHeader, AppScreen, AppSheet, RoundAction } from "../components/AppUI";
import { useAppState } from "../lib/AppProvider";
import { messageFor, session } from "../lib/api";

const settings = [
  { id: "personal", title: "Personal Information", description: "Manage your name, email, phone number", icon: "personal" as const },
  { id: "notifications", title: "Notifications", description: "Choose which notifications you want to receive.", icon: "notify" as const },
  { id: "security", title: "Security & Privacy", description: "Manage your password, login methods, connected accounts, and privacy settings.", icon: "security" as const },
  { id: "support", title: "Help & Support", description: "Find answers, get help, or report an issue with your MoneyLens experience.", icon: "support" as const },
  { id: "policies", title: "Terms & Policies", description: "Review MoneyLens terms, privacy policy, and other important information.", icon: "policies" as const },
];

export function Profile() {
  const { user, clearActiveStatement } = useAppState();
  const [action, setAction] = useState<"logout" | "delete" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  const inFlight = useRef(false);
  useEffect(() => {
    let active = true;
    setLoadError("");
    void session.refreshUser().catch(cause => { if (active) setLoadError(messageFor(cause)); });
    return () => { active = false; };
  }, [retry]);
  const close = () => { if (!inFlight.current) { setAction(null); setError(""); } };
  const submit = async () => {
    if (!action || inFlight.current) return;
    inFlight.current = true;
    setBusy(true); setError("");
    try {
      if (action === "delete") await session.deleteAccount();
      else await session.logout();
      await clearActiveStatement();
      router.replace("/auth");
    } catch (cause) {
      if (action === "logout" && !session.user) {
        await clearActiveStatement();
        router.replace({ pathname: "/auth", params: { notice: "logout_unconfirmed" } });
      } else setError(messageFor(cause));
    } finally { inFlight.current = false; setBusy(false); }
  };
  return <AppScreen active="Profile">
    <AppHeader title="My Profile"><RoundAction name="edit" label="Edit personal information" onPress={() => router.push("/settings?section=personal")} /></AppHeader>
    <ErrorNote message={loadError} />
    {!!loadError && <View style={{ marginBottom: 20 }}><Button title="Retry loading profile" secondary onPress={() => setRetry(value => value + 1)} /></View>}
    <View style={styles.identity}><AccountAvatar /><Label style={{ fontSize: 16, marginTop: 16 }}>{user?.firstName || "Your account"}</Label><Label style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>{user?.email}</Label></View>
    <View style={{ gap: 16 }}>{settings.map(item => <ProfileRow key={item.id} {...item} onPress={() => router.push({ pathname: "/settings", params: { section: item.id } })} />)}
      <ProfileRow icon="logout" title="Log Out" description="Sign out of your MoneyLens account on this device." onPress={() => { setError(""); setAction("logout"); }} />
      <ProfileRow icon="deleteAccount" title="Delete Account" description="Permanently delete your account and associated data." onPress={() => { setError(""); setAction("delete"); }} danger />
    </View>
    <AppSheet visible={!!action} title={action === "delete" ? "Delete account?" : "Log out?"} onClose={close} busy={busy} dismissTitle="Cancel">
      <Label style={p.body}>{action === "delete" ? "This permanently deletes your MoneyLens account, transactions and saved rules. This cannot be undone." : "You’ll need to sign in again to access your account."}</Label>
      <ErrorNote message={error} />
      <View style={{ marginTop: 20 }}><Button title={action === "delete" ? "Permanently delete account" : "Log out"} secondary loading={busy} onPress={() => void submit()} /></View>
    </AppSheet>
  </AppScreen>;
}
function ProfileRow({ icon, title, description, onPress, danger }: {
  icon: "personal" | "notify" | "security" | "support" | "policies" | "logout" | "deleteAccount";
  title: string; description: string; onPress: () => void; danger?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={styles.setting}>
    <DesignAsset name={icon} width={35} /><View style={{ flex: 1, minWidth: 0 }}><Label style={[p.body, danger && { color: "#EF3E2E" }]}>{title}</Label><Label numberOfLines={1} style={{ fontSize: 12, color: C.muted, marginTop: 10 }}>{description}</Label></View><DesignAsset name="rowChevron" width={14} />
  </Pressable>;
}
export function Settings() {
  const { section = "personal" } = useLocalSearchParams<{ section?: string }>();
  const { user } = useAppState();
  const current = settings.find(item => item.id === section) ?? settings[0];
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [details, setDetails] = useState("");
  const inFlight = useRef(false);
  const normalized = firstName.trim();
  const validName = normalized.length > 0 && normalized.length <= 80 && [...normalized].every(character => character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127);
  useEffect(() => { setFirstName(user?.firstName ?? ""); }, [user?.firstName]);
  const save = async () => {
    if (!validName || normalized === user?.firstName || inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(""); setSaved(false);
    try { await session.personalize(normalized); setSaved(true); }
    catch (cause) { setError(messageFor(cause)); }
    finally { inFlight.current = false; setBusy(false); }
  };
  return <AppScreen active="Profile" back={() => router.replace("/profile")}>
    <View style={{ marginTop: 32 }}><AppHeader title={current.title} subtitle={current.description} /></View>
    {current.id === "personal" ? <>
      <View style={[styles.identity, { marginTop: 0, marginBottom: 24 }]}><AccountAvatar /><Label style={p.caption}>Your account</Label></View>
      <Field label="First name" value={firstName} onChangeText={value => { setFirstName(value); setSaved(false); setError(""); }} autoComplete="given-name" maxLength={80} editable={!busy} />
      <Field label="Email address" value={user?.email ?? ""} editable={false} accessibilityHint="Email changes are not available yet" />
      <Field label="Phone number" value="" placeholder="Not available yet" editable={false} />
      <Label style={[p.caption, { fontSize: 12, marginTop: 0, marginBottom: 20 }]}>You can update your first name. Email changes, phone numbers and profile photos aren’t available yet.</Label>
      <ErrorNote message={error} />
      {saved && <Label accessibilityLiveRegion="polite" style={{ color: "#009666", marginBottom: 16 }}>Profile updated.</Label>}
      <Button title="Save changes" loading={busy} disabled={!validName || normalized === user?.firstName} onPress={() => void save()} />
    </> : current.id === "notifications" ? <View style={{ gap: 14 }}>{["Statement updates", "Money insights", "Tips & news"].map((label, index) => <View key={label} style={[p.card, p.row]}><View style={{ flex: 1 }}><Label style={p.body}>{label}</Label><Label style={p.caption}>{index === 0 ? "Know when your statement is ready" : index === 1 ? "New patterns in your spending" : "Useful updates from MoneyLens"}</Label></View><Switch accessibilityLabel={label} accessibilityHint="Notification preferences are not available yet" disabled value={false} thumbColor="#FFFFFF" trackColor={{ false: "#E5E8EB", true: C.blue }} /></View>)}</View>
      : <View style={{ gap: 16 }}>{(current.id === "security" ? ["Change password", "Connected accounts", "Privacy preferences"] : current.id === "support" ? ["Frequently asked questions", "Contact support", "Report an issue"] : ["Terms & Conditions", "Privacy Policy", "Data & statement privacy"]).map(label => {
        const url = label === "Contact support" ? process.env.EXPO_PUBLIC_SUPPORT_URL : label === "Terms & Conditions" ? process.env.EXPO_PUBLIC_TERMS_URL : label === "Privacy Policy" ? process.env.EXPO_PUBLIC_PRIVACY_URL : undefined;
        return label === "Frequently asked questions" || label === "Data & statement privacy" ? <Pressable key={label} accessibilityRole="button" onPress={() => setDetails(label)} style={[p.card, p.row]}><Label style={p.body}>{label}</Label><DesignAsset name="rowChevron" width={14} /></Pressable> : <ConfiguredLink key={label} title={label} url={url} />;
      })}</View>}
    {current.id !== "personal" && <Label style={[p.caption, { marginTop: 24 }]}>{current.id === "notifications" ? "Notification preferences aren’t available yet." : current.id === "security" ? "These account settings aren’t available yet." : "Unavailable options will be enabled when the service is ready."}</Label>}
    <AppSheet title={details} visible={!!details} onClose={() => setDetails("")}><Label style={p.body}>{details === "Frequently asked questions" ? "Choose a PDF bank statement of up to 20 MB from Home. If it cannot be read, try another supported statement." : "Your original PDF isn’t retained after processing. Uploading it does not give MoneyLens permission to make transactions."}</Label></AppSheet>
  </AppScreen>;
}
function ConfiguredLink({ title, url }: { title: string; url?: string }) {
  const [error, setError] = useState("");
  return <><Pressable accessibilityRole="link" accessibilityLabel={title} accessibilityState={{ disabled: !url }} disabled={!url} accessibilityHint={!url ? "Not available yet" : undefined} onPress={() => { setError(""); void Linking.openURL(url!).catch(() => setError("This link could not be opened. Please try again.")); }} style={[p.card, p.row]}>
    <Label style={[p.body, { flex: 1 }]}>{title}</Label><DesignAsset name="rowChevron" width={14} />
  </Pressable><ErrorNote message={error} /></>;
}
const styles = StyleSheet.create({
  identity: { alignItems: "center", marginTop: 14, marginBottom: 32 },
  setting: { padding: 16, minHeight: 75, backgroundColor: "white", borderRadius: 20, borderWidth: 1, borderColor: "#D6D6D666", flexDirection: "row", alignItems: "center", gap: 16 },
});
