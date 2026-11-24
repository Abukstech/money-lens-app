import { Stack, usePathname } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider, useAppState } from "../lib/AppProvider";
import { Pwa } from "../web/Pwa";
import "../web/styles.css";

function WebShell() {
  const pathname = usePathname();
  const { user } = useAppState();
  const landing = pathname === "/landing" || (pathname === "/" && !user);
  return (
      <div className={landing ? "landing-shell" : "mobile-shell"}>
        <Pwa />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "none",
              contentStyle: { backgroundColor: "#F3FBFF" },
            }}
          />
      </div>
  );
}

export default function WebLayout() {
  return <SafeAreaProvider><AppProvider><WebShell /></AppProvider></SafeAreaProvider>;
}
