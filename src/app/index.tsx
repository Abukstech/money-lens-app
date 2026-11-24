import { Redirect } from "expo-router";
import { useAppState } from "../lib/AppProvider";
import { Home } from "../screens/Home";
export default function HomeRoute() {
  const { user, seen } = useAppState();
  if (!user) return <Redirect href={seen ? "/auth" : "/onboarding"} />;
  if (!user.firstName) return <Redirect href="/personalize" />;
  return <Home />;
}
