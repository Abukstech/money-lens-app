import React from "react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { Auth } from "../src/screens/Auth";
import { session } from "../src/lib/api";
jest.mock("../src/lib/api", () => ({
  session: {
    publicRequest: jest.fn(),
    establish: jest.fn(),
    personalize: jest.fn(),
    logout: jest.fn(),
  },
  messageFor: () => "Please try again.",
}));
const api = jest.mocked(session.publicRequest);
describe("Authentication screens", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("moves from email through verification and rejects mismatched passwords", async () => {
    api
      .mockResolvedValueOnce({
        challengeId: "challenge-1",
        expiresIn: 600,
        resendAfter: 60,
      })
      .mockResolvedValueOnce({ grant: "grant-1" });
    await render(<Auth initial="signup" onBack={jest.fn()} />);
    await fireEvent.changeText(
      screen.getByLabelText("Email address"),
      "faith@example.test",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() =>
      expect(screen.getByText("Enter your code")).toBeTruthy(),
    );
    expect(api).toHaveBeenCalledWith("/auth/email/request-code", {
      email: "faith@example.test",
      purpose: "registration",
    });
    await fireEvent.changeText(
      screen.getByLabelText("Six-digit verification code"),
      "123456",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() =>
      expect(screen.getByText("Create a password")).toBeTruthy(),
    );
    await fireEvent.changeText(
      screen.getByLabelText("Password"),
      "long-enough-password",
    );
    await fireEvent.changeText(
      screen.getByLabelText("Confirm password"),
      "different-password",
    );
    expect(screen.getByText("Your passwords don’t match.")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Continue" }).props.accessibilityState
        .disabled,
    ).toBe(true);
  });
  it("signs in with the selected remember preference", async () => {
    const tokens = {
      accessToken: "access",
      refreshToken: "refresh",
      expiresIn: 900,
    };
    api.mockResolvedValueOnce(tokens);
    await render(<Auth initial="signin" onBack={jest.fn()} />);
    await fireEvent.changeText(
      screen.getByLabelText("Email address"),
      "faith@example.test",
    );
    await fireEvent.changeText(
      screen.getByLabelText("Password"),
      "long-enough-password",
    );
    await fireEvent.press(screen.getByRole("checkbox"));
    await fireEvent.press(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() =>
      expect(session.establish).toHaveBeenCalledWith(tokens, false),
    );
  });
  it("allows password reset navigation and going back without retaining passwords", async () => {
    await render(<Auth initial="signin" onBack={jest.fn()} />);
    await fireEvent.changeText(
      screen.getByLabelText("Password"),
      "long-enough-password",
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Forgot password?" }),
    );
    expect(screen.getByText("Reset your password")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByLabelText("Password").props.value).toBe("");
  });
});

describe("Recovery and personalization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("verifies reset codes, changes the password, and returns to sign-in", async () => {
    api
      .mockResolvedValueOnce({
        challengeId: "reset-challenge",
        expiresIn: 600,
        resendAfter: 60,
      })
      .mockResolvedValueOnce({ grant: "reset-grant" })
      .mockResolvedValueOnce({ updated: true });
    await render(<Auth initial="reset" onBack={jest.fn()} />);
    await fireEvent.changeText(
      screen.getByLabelText("Email address"),
      "faith@example.test",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() =>
      expect(screen.getByText("Enter your code")).toBeTruthy(),
    );
    await fireEvent.changeText(
      screen.getByLabelText("Six-digit verification code"),
      "001234",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() =>
      expect(screen.getByText("Create a new password")).toBeTruthy(),
    );
    await fireEvent.changeText(
      screen.getByLabelText("Password"),
      "new-long-password",
    );
    await fireEvent.changeText(
      screen.getByLabelText("Confirm password"),
      "new-long-password",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() =>
      expect(screen.getByText("Password updated")).toBeTruthy(),
    );
    expect(api).toHaveBeenLastCalledWith("/auth/password/reset", {
      email: "faith@example.test",
      password: "new-long-password",
      grant: "reset-grant",
    });
    await fireEvent.press(screen.getByRole("button", { name: "Sign In" }));
    expect(screen.getByLabelText("Password").props.value).toBe("");
  });
  it("saves the trimmed first name", async () => {
    await render(<Auth initial="name" onBack={jest.fn()} />);
    await fireEvent.changeText(screen.getByLabelText("First name"), " Faith ");
    await fireEvent.press(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() =>
      expect(session.personalize).toHaveBeenCalledWith("Faith"),
    );
  });
});
