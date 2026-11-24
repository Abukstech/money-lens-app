import { Redirect, router } from "expo-router";
import { useAppState } from "../lib/AppProvider";
import { Auth } from "../screens/Auth";

export default function WebAuthRoute() {
  const { user } = useAppState();
  if (user) return <Redirect href="/" />;
  return <Auth initial="signin" onBack={() => router.replace("/")} showSignInLink />;
}
