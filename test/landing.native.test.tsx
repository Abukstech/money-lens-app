import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import { Landing } from "../src/screens/Landing";

jest.mock("../src/components/LandingImage", () => ({ LandingImage: () => null }));

describe("Public landing page", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("opens the existing signup flow from either Get Started button", async () => {
    await render(<Landing />);
    const buttons = screen.getAllByRole("button", { name: "Get Started" });
    for (const button of buttons) {
      await fireEvent.press(button);
      expect(router.push).toHaveBeenLastCalledWith({ pathname: "/auth", params: { step: "signup" } });
    }
    expect(router.push).toHaveBeenCalledTimes(2);
  });

  it("allows one FAQ to expand at a time and lets the reader close it", async () => {
    await render(<Landing />);
    const second = screen.getByRole("button", { name: "How does MoneyLens work?" });
    expect(screen.getByText(/^MoneyLens is a personal finance insights platform/)).toBeTruthy();
    await fireEvent.press(second);
    expect(screen.queryByText(/^MoneyLens is a personal finance insights platform/)).toBeNull();
    expect(screen.getByText(/^Upload a bank statement, review your transactions/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "How does MoneyLens work?" }));
    expect(screen.queryByText(/^Upload a bank statement, review your transactions/)).toBeNull();
  });
});
