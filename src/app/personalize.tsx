import { Redirect, router } from "expo-router";
import { useAppState } from "../lib/AppProvider";
import { Auth } from "../screens/Auth";
export default function PersonalizationRoute() {
  const { user } = useAppState();
  if (!user) return <Redirect href="/auth" />;
  if (user.firstName) return <Redirect href="/" />;
  return <Auth initial="name" onBack={() => router.replace("/auth")} />;
}
