import { Redirect, Stack } from "expo-router";
import { useAppState } from "../../lib/AppProvider";
export default function SignedInLayout() {
  const { user } = useAppState();
  if (!user) return <Redirect href="/auth" />;
  return <Stack screenOptions={{ headerShown: false, animation: "none", contentStyle: { backgroundColor: "#F0F9FF" } }} />;
}
