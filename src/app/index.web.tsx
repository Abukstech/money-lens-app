import { Redirect } from "expo-router";
import { useAppState } from "../lib/AppProvider";
import { Home } from "../screens/Home";
import { Landing } from "../screens/Landing";

export default function WebHomeRoute() {
  const { user } = useAppState();
  if (!user) return <Landing />;
  if (!user.firstName) return <Redirect href="/personalize" />;
  return <Home />;
}
