import { Redirect } from "expo-router";
import { useAppState } from "../lib/AppProvider";

export default function WebOnboardingRoute() {
  const { user } = useAppState();
  return <Redirect href={user ? "/" : { pathname: "/auth", params: { step: "signup" } }} />;
}
