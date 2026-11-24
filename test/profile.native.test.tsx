import React from "react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Profile, Settings } from "../src/screens/Profile";
import { useAppState } from "../src/lib/AppProvider";
import { session } from "../src/lib/api";

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));
jest.mock("../src/lib/AppProvider", () => ({ useAppState: jest.fn() }));
jest.mock("../src/lib/api", () => ({
  session: { user: null, refreshUser: jest.fn(), personalize: jest.fn(), logout: jest.fn(), deleteAccount: jest.fn() },
  messageFor: () => "We couldn’t connect. Check your connection and try again.",
}));
const user = { userId: "u1", firstName: "Faith", email: "faith@example.test", emailVerifiedAt: null };
const errorMessage = "We couldn’t connect. Check your connection and try again.";
beforeEach(() => {
  jest.clearAllMocks();
  session.user = user;
  jest.mocked(useAppState).mockReturnValue({
    user,
    seen: true,
    activeStatementId: null,
    saveActiveStatement: async () => {},
    clearActiveStatement: async () => {},
    completeOnboarding: async () => {},
  });
  jest.mocked(useLocalSearchParams).mockReturnValue({});
  jest.mocked(session.refreshUser).mockResolvedValue(undefined);
  jest.mocked(session.personalize).mockResolvedValue(undefined);
  jest.mocked(session.logout).mockResolvedValue(undefined);
  jest.mocked(session.deleteAccount).mockResolvedValue(undefined);
});

describe("Connected profile", () => {
  it("shows the signed-in identity, refreshes it, and opens the existing edit screen", async () => {
    await render(<Profile />);
    expect(screen.getByText("Faith")).toBeTruthy();
    expect(screen.getByText(user.email)).toBeTruthy();
    expect(session.refreshUser).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Design preview/)).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Edit personal information" }));
    expect(router.push).toHaveBeenCalledWith("/settings?section=personal");
  });
  it("keeps the account visible after a refresh failure and supports retry", async () => {
    jest.mocked(session.refreshUser).mockRejectedValueOnce(new Error("offline"));
    await render(<Profile />);
    expect(await screen.findByText(errorMessage)).toBeTruthy();
    expect(screen.getByText(user.email)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Retry loading profile" }));
    await waitFor(() => expect(screen.queryByText(errorMessage)).toBeNull());
    expect(session.refreshUser).toHaveBeenCalledTimes(2);
  });
  it("only deletes after confirmation and retains the account when deletion fails", async () => {
    jest.mocked(session.deleteAccount).mockRejectedValueOnce(new Error("offline"));
    await render(<Profile />);
    await fireEvent.press(screen.getByRole("button", { name: "Delete Account" }));
    expect(session.deleteAccount).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole("button", { name: "Permanently delete account" }));
    expect(await screen.findByText(errorMessage)).toBeTruthy();
    expect(router.replace).not.toHaveBeenCalled();
    expect(session.user).toEqual(user);
    await fireEvent.press(screen.getByRole("button", { name: "Permanently delete account" }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/auth"));
  });
  it("lets the user cancel sign-out before sending a request", async () => {
    await render(<Profile />);
    await fireEvent.press(screen.getByRole("button", { name: "Log Out" }));
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    expect(session.logout).not.toHaveBeenCalled();
    expect(screen.getByText(user.email)).toBeTruthy();
  });
  it("signs out through the account service after confirmation", async () => {
    await render(<Profile />);
    await fireEvent.press(screen.getByRole("button", { name: "Log Out" }));
    await fireEvent.press(screen.getByRole("button", { name: "Log out" }));
    expect(session.logout).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/auth"));
  });
  it("reports local-only sign-out when server revocation cannot be confirmed", async () => {
    jest.mocked(session.logout).mockImplementationOnce(async () => { session.user = null; throw new Error("offline"); });
    await render(<Profile />);
    await fireEvent.press(screen.getByRole("button", { name: "Log Out" }));
    await fireEvent.press(screen.getByRole("button", { name: "Log out" }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith({ pathname: "/auth", params: { notice: "logout_unconfirmed" } }));
  });
});

describe("Personal information", () => {
  it("saves only a valid changed first name while unsupported fields stay read-only", async () => {
    await render(<Settings />);
    expect(screen.getByLabelText("Email address").props.editable).toBe(false);
    expect(screen.getByLabelText("Phone number").props.editable).toBe(false);
    expect(screen.getByRole("button", { name: "Save changes" }).props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByLabelText("First name"), "   ");
    expect(screen.getByRole("button", { name: "Save changes" }).props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByLabelText("First name"), "  Ada  ");
    await fireEvent.press(screen.getByRole("button", { name: "Save changes" }));
    expect(session.personalize).toHaveBeenCalledWith("Ada");
    expect(await screen.findByText("Profile updated.")).toBeTruthy();
  });
  it("retains the draft and allows retry after a save failure", async () => {
    jest.mocked(session.personalize).mockRejectedValueOnce(new Error("offline"));
    await render(<Settings />);
    await fireEvent.changeText(screen.getByLabelText("First name"), "Ada");
    await fireEvent.press(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText(errorMessage)).toBeTruthy();
    expect(screen.getByLabelText("First name").props.value).toBe("Ada");
    expect(screen.queryByText("Profile updated.")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Profile updated.")).toBeTruthy();
  });
  it("keeps the existing notification switches unavailable without a preferences endpoint", async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ section: "notifications" });
    await render(<Settings />);
    for (const control of screen.getAllByRole("switch")) expect(control.props.disabled).toBe(true);
    expect(screen.getByText("Notification preferences aren’t available yet.")).toBeTruthy();
    expect(session.personalize).not.toHaveBeenCalled();
  });
});
