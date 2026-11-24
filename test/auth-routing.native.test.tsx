import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import NativeHomeRoute from "../src/app/index";
import WebHomeRoute from "../src/app/index.web";
import NativeAuthRoute from "../src/app/auth";
import WebAuthRoute from "../src/app/auth.web";
import WebOnboardingRoute from "../src/app/onboarding.web";

let mockSeen = false;
let mockUser: { firstName: string } | null = null;
jest.mock("../src/lib/AppProvider", () => ({
  useAppState: () => ({ seen: mockSeen, user: mockUser }),
}));
jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof import("./router-mock")>("./router-mock"),
  Redirect: ({ href }: { href: unknown }) => {
    const { Text } = jest.requireActual<typeof import("react-native")>("react-native");
    return <Text testID="redirect">{JSON.stringify(href)}</Text>;
  },
}));
jest.mock("../src/screens/Landing", () => ({ Landing: () => {
  const { Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return <Text>Public landing page</Text>;
} }));
jest.mock("../src/screens/Home", () => ({ Home: () => null }));
jest.mock("../src/screens/Auth", () => ({ Auth: ({ onBack }: { onBack: () => void }) => {
  const { Button } = jest.requireActual<typeof import("react-native")>("react-native");
  return <Button title="Back" onPress={onBack} />;
} }));

describe("Web and native authentication entry points", () => {
  beforeEach(() => { mockSeen = false; mockUser = null; jest.clearAllMocks(); });

  it("keeps onboarding for first-time native users", async () => {
    await render(<NativeHomeRoute />);
    expect(screen.getByTestId("redirect").props.children).toBe('"/onboarding"');
  });

  it("sends returning native users directly to authentication", async () => {
    mockSeen = true;
    await render(<NativeHomeRoute />);
    expect(screen.getByTestId("redirect").props.children).toBe('"/auth"');
  });

  it("keeps the public landing page as the web entry point", async () => {
    await render(<WebHomeRoute />);
    expect(screen.getByText("Public landing page")).toBeTruthy();
  });

  it("redirects old web onboarding links directly to signup", async () => {
    await render(<WebOnboardingRoute />);
    expect(JSON.parse(screen.getByTestId("redirect").props.children)).toEqual({ pathname: "/auth", params: { step: "signup" } });
  });

  it("returns from web authentication to the landing page", async () => {
    await render(<WebAuthRoute />);
    await fireEvent.press(screen.getByRole("button", { name: "Back" }));
    expect(router.replace).toHaveBeenCalledWith("/");
  });

  it("keeps native authentication's back navigation on onboarding", async () => {
    await render(<NativeAuthRoute />);
    await fireEvent.press(screen.getByRole("button", { name: "Back" }));
    expect(router.replace).toHaveBeenCalledWith("/onboarding");
  });
});
