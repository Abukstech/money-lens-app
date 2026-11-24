import React from "react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Ask, History } from "../src/screens/Ask";
import { Review } from "../src/screens/Review";
import { Story } from "../src/screens/Story";
import { router } from "expo-router";
import { confirmTransactionGroup, listCategories, listReviewGroups, reviewGroupMembers } from "../src/lib/api";

const mockParams = jest.fn(() => ({}) as Record<string, string>);

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), setParams: jest.fn() },
  useLocalSearchParams: () => mockParams(),
}));

jest.mock("../src/lib/api", () => ({
  listReviewGroups: jest.fn(),
  reviewGroupMembers: jest.fn(),
  getTransaction: jest.fn(),
  confirmTransactionGroup: jest.fn(async () => ({})),
  listCategories: jest.fn(async () => []),
  confirmTransactionCategory: jest.fn(async () => ({})),
  messageFor: () => "Something went wrong.",
}));

jest.mock("../src/lib/AppProvider", () => ({
  useAppState: () => ({
    user: { firstName: "Faith", email: "faith@example.test" },
    seen: true,
    activeStatementId: "s1",
    saveActiveStatement: jest.fn(async () => {}),
    clearActiveStatement: jest.fn(async () => {}),
    completeOnboarding: async () => {},
  }),
}));

describe("Financial screens with sample data", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams.mockReturnValue({});
    jest.mocked(listCategories).mockResolvedValue([]);
  });
  it("opens the payday pattern detail and keeps the savings estimate marked as sample data", async () => {
    await render(<Story />);
    expect(screen.getByText("July 2026 · Sample analysis")).toBeTruthy();
    expect(screen.getByText("Potential Savings")).toBeTruthy();
    expect(screen.getByText("₦480,000")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "See Pattern" }));
    expect(screen.getByText("Your spending after payday")).toBeTruthy();
    expect(screen.getByText(/This illustrates a timing pattern/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Done" }));
    await fireEvent.press(screen.getByRole("button", { name: "Review your transactions" }));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/review",
      params: { statementId: "s1" },
    });
  });
  it("shows a sample answer and labels custom questions as unavailable", async () => {
    await render(<Ask />);
    await fireEvent.press(screen.getByRole("button", { name: "Where did most of my money go?" }));
    expect(screen.getByText("Based on the sample July 2026 statement")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Ask about your spending"), "My own question");
    await fireEvent.press(screen.getByRole("button", { name: "Send question" }));
    expect(screen.getByText("Live answers aren’t connected yet. The examples shown here use sample statement data.")).toBeTruthy();
    expect(screen.getByLabelText("Ask about your spending").props.value).toBe("");
  });

  it("requires the two important review choices before advancing", async () => {
    mockParams.mockReturnValue({ sample: "1" });
    await render(<Review />);
    expect(screen.getByRole("button", { name: "Review" }).props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(screen.getByRole("radio", { name: "Yes, it’s my income" }));
    await fireEvent.press(screen.getByRole("radio", { name: "I spent this money" }));
    expect(screen.getByRole("button", { name: "Review" }).props.accessibilityState.disabled).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Select a category" }));
    await fireEvent.press(screen.getByRole("radio", { name: "Food" }));
    expect(screen.getByText("Food")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Review" }));
    expect(router.replace).toHaveBeenCalledWith("/story");
  });

  it("loads a matching group and saves only selected answers", async () => {
    mockParams.mockReturnValue({ statementId: "s1" });
    const row = { id: "t1", statementId: "s1", date: "2026-10-15", description: "TRANSFER",
      amount: "15000.00", direction: "debit", currency: "NGN", status: "requires_user_tagging",
      category: "transfer_unknown", revision: 4 };
    jest.mocked(listReviewGroups).mockResolvedValue({ items: [{ key: "g1", count: 1,
      totalAmount: "15000.00", direction: "debit", currency: "NGN", suggestedCategory: null,
      previews: [row], memoryEligible: false, proposedConditions: null }], nextCursor: null,
      transactionCount: 1, groupCount: 1 });
    jest.mocked(reviewGroupMembers).mockResolvedValue({ items: [row], nextCursor: null });
    await render(<Review />);
    await waitFor(() => expect(screen.getByText("TRANSFER")).toBeTruthy());
    expect(screen.getByRole("button", { name: "Save selected answers" }).props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(screen.getByRole("button", { name: "Select a category" }));
    await fireEvent.press(screen.getByRole("radio", { name: "Groceries" }));
    await fireEvent.press(screen.getByRole("button", { name: "Save selected answers" }));
    await waitFor(() => expect(confirmTransactionGroup).toHaveBeenCalledWith(
      [{ transactionId: "t1", revision: 4 }], "groceries", undefined));
    expect(router.replace).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/",
      params: expect.objectContaining({ view: "results", statementId: "s1" }) }));
  });

  it("filters sample history and removes it only after a local confirmation", async () => {
    await render(<History />);
    await fireEvent.changeText(screen.getByLabelText("Search your chats"), "no match");
    expect(screen.getByText("No matching conversations.")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Search your chats"), "");
    await fireEvent.press(screen.getByRole("button", { name: "Remove sample conversation" }));
    expect(screen.getByText("This removes the sample conversation from this screen.")).toBeTruthy();
    await fireEvent.press(screen.getAllByRole("button", { name: "Remove sample conversation" }).at(-1)!);
    expect(screen.getByText("No conversations yet.")).toBeTruthy();
  });

});
