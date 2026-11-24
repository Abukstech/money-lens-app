import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { ActivityIndicator, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { Brand, Button, C, ErrorNote, Label } from "../components/ui";
import { messageFor, session } from "./api";
import { ApiError, User } from "./session";
import {
  clearActiveStatement as clearStoredActiveStatement,
  readActiveStatement,
  writeActiveStatement,
} from "./activeStatement";
void SplashScreen.preventAutoHideAsync().catch(() => {});
type AppState = {
  user: User | null;
  seen: boolean;
  activeStatementId: string | null;
  saveActiveStatement: (statementId: string) => Promise<void>;
  clearActiveStatement: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
};
const AppContext = createContext<AppState | null>(null);
export function useAppState() {
  const value = useContext(AppContext);
  if (!value) throw new Error("APP_PROVIDER_REQUIRED");
  return value;
}
export function AppProvider({ children }: { children: React.ReactNode }) {
  /* Metro requires static font asset paths. */
  /* eslint-disable @typescript-eslint/no-require-imports */
  const [fontsLoaded, fontError] = useFonts({
    "Aeonik-Regular": require("../../assets/fonts/Aeonik-Regular.otf"),
    "Aeonik-Bold": require("../../assets/fonts/Aeonik-Bold.otf"),
    "Aeonik-Light": require("../../assets/fonts/Aeonik-Light.otf"),
  });
  /* eslint-enable @typescript-eslint/no-require-imports */
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState("");
  const [seen, setSeen] = useState(false);
  const [user, setUser] = useState(session.user);
  const [activeStatementId, setActiveStatementId] = useState<string | null>(
    null,
  );
  useEffect(() => session.subscribe(() => setUser(session.user)), []);
  const loadActiveStatement = useCallback(async (nextUser: User | null) => {
    if (!nextUser) {
      setActiveStatementId(null);
      return;
    }
    const stored = await readActiveStatement();
    setActiveStatementId(
      stored?.userId === nextUser.userId ? stored.statementId : null,
    );
  }, []);
  const boot = useCallback(async () => {
    setReady(false);
    setBootError("");
    try {
      setSeen((await AsyncStorage.getItem("moneylens.onboarding")) === "done");
      await session.restore();
      setUser(session.user);
      await loadActiveStatement(session.user);
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401))
        setBootError(messageFor(error));
    } finally {
      setReady(true);
    }
  }, [loadActiveStatement]);
  useEffect(() => {
    void boot();
  }, [boot]);
  useEffect(() => {
    let active = true;
    if (!user) {
      setActiveStatementId(null);
      return;
    }
    void readActiveStatement().then((stored) => {
      if (active)
        setActiveStatementId(
          stored?.userId === user.userId ? stored.statementId : null,
        );
    });
    return () => {
      active = false;
    };
  }, [user?.userId]);
  const saveActiveStatement = useCallback(async (statementId: string) => {
    const current = session.user;
    if (!current) return;
    setActiveStatementId(statementId);
    try {
      await writeActiveStatement({
        userId: current.userId,
        statementId,
        savedAt: Date.now(),
      });
    } catch {
      /* The in-memory value still restores this running session. */
    }
  }, []);
  const clearActiveStatement = useCallback(async () => {
    setActiveStatementId(null);
    try {
      await clearStoredActiveStatement();
    } catch {
      /* A failed clear should not block signing out. */
    }
  }, []);
  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);
  const completeOnboarding = async () => {
    await AsyncStorage.setItem("moneylens.onboarding", "done");
    setSeen(true);
  };
  if (!ready || (!fontsLoaded && !fontError))
    return (
      <LinearGradient
        colors={["white", "white", "#DFF6FF", "#24B8FA"]}
        locations={[0, 0.68, 0.86, 1]}
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      >
        <Brand fallback={!fontsLoaded} />
        <ActivityIndicator
          color={C.blue}
          style={{ position: "absolute", bottom: 60 }}
        />
      </LinearGradient>
    );
  if (bootError)
    return (
      <LinearGradient
        colors={["white", "#DFF3FF"]}
        style={{ flex: 1, justifyContent: "center", padding: 28 }}
      >
        <Brand />
        <Label style={{ marginTop: 25 }}>Let’s get you connected.</Label>
        <ErrorNote message={bootError} />
        <Button title="Retry" onPress={() => void boot()} />
        <View style={{ marginTop: 15 }}>
          <Button
            title="Sign in again"
            secondary
            onPress={() => {
              void session
                .clear()
                .then(() => {
                  setBootError("");
                  setSeen(true);
                })
                .catch((error) => setBootError(messageFor(error)));
            }}
          />
        </View>
      </LinearGradient>
    );
  return (
    <AppContext.Provider
      value={{
        user,
        seen,
        activeStatementId,
        saveActiveStatement,
        clearActiveStatement,
        completeOnboarding,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
