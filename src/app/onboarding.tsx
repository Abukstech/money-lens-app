import { useState } from "react";
import { Redirect, router } from "expo-router";
import { View } from "react-native";
import { useAppState } from "../lib/AppProvider";
import { ErrorNote } from "../components/ui";
import { Onboarding } from "../screens/Onboarding";
export default function OnboardingRoute() {
  const { user, completeOnboarding } = useAppState();
  const [error, setError] = useState("");
  if (user) return <Redirect href="/" />;
  const open = async (step: "signin" | "signup") => {
    try {
      await completeOnboarding();
      router.replace({ pathname: "/auth", params: { step } });
    } catch {
      setError("We couldn’t save your progress. Please try again.");
    }
  };
  return (
    <View style={{ flex: 1 }}>
      <Onboarding
        onSignIn={() => void open("signin")}
        onSignUp={() => void open("signup")}
      />
      {!!error && (
        <View
          style={{
            position: "absolute",
            top: 80,
            left: 20,
            right: 20,
            backgroundColor: "white",
            padding: 12,
            borderRadius: 15,
          }}
        >
          <ErrorNote message={error} />
        </View>
      )}
    </View>
  );
}
