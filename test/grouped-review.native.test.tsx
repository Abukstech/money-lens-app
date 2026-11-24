import React from "react";
import { beforeEach, expect, it, jest } from "@jest/globals";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { GroupedReview } from "../src/screens/GroupedReview";
import {
  confirmTransactionGroup,
  getTransaction,
  listReviewGroups,
  reviewGroupMembers,
  Transaction,
} from "../src/lib/api";
import { router } from "expo-router";

jest.mock("../src/lib/AppProvider", () => ({
  useAppState: () => ({
    user: { firstName: "Example", email: "example@example.test" },
  }),
}));
jest.mock("expo-router", () => ({ router: { replace: jest.fn() } }));
jest.mock("../src/lib/api", () => ({
  listCategories: jest.fn(async () => []),
  listReviewGroups: jest.fn(),
  reviewGroupMembers: jest.fn(),
  getTransaction: jest.fn(),
  confirmTransactionGroup: jest.fn(async () => ({})),
  messageFor: () => "This transaction changed. Reloaded your review.",
}));
const row = (id: string, direction = "debit"): Transaction => ({
  id,
  statementId: "s1",
  date: "2026-10-15",
  description: `TRANSFER RENT ${id}`,
  amount: "100.00",
  direction,
  currency: "NGN",
  status: "requires_user_tagging",
  category: "transfer_unknown",
  revision: 1,
});
function setup(rows: Transaction[], memoryEligible = false) {
  jest.mocked(listReviewGroups).mockResolvedValue({
    items: [
      {
        key: "group",
        count: rows.length,
        direction: rows[0].direction,
        currency: "NGN",
        totalAmount: `${rows.length * 100}.00`,
        suggestedCategory: null,
        previews: rows.slice(0, 3),
        memoryEligible,
        proposedConditions: memoryEligible
          ? {
              direction: "debit",
              currency: "NGN",
              minAmount: "100.00",
              maxAmount: "100.00",
              narrationTokens: ["RENT"],
            }
          : null,
      },
    ],
    groupCount: 1,
    transactionCount: rows.length,
    nextCursor: null,
  });
  jest
    .mocked(reviewGroupMembers)
    .mockResolvedValue({ items: rows, nextCursor: null });
}
async function expand(count: number) {
  const name = `Review ${count} transactions individually`;
  await waitFor(() =>
    expect(screen.getByRole("button", { name })).toBeTruthy(),
  );
  await fireEvent.press(screen.getByRole("button", { name }));
}
async function choose(category: string) {
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Select a category" }),
    ).toBeTruthy(),
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Select a category" }),
  );
  await fireEvent.press(screen.getByRole("radio", { name: category }));
}
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(confirmTransactionGroup).mockResolvedValue({});
});

it("lets users skip every review question without writing classifications", async () => {
  setup([row("one")]);
  await render(<GroupedReview statementId="s1" />);
  await fireEvent.press(screen.getByRole("button", { name: "Review later" }));
  expect(confirmTransactionGroup).not.toHaveBeenCalled();
  expect(router.replace).toHaveBeenCalledWith(
    expect.objectContaining({
      params: expect.objectContaining({ statementId: "s1", view: "results" }),
    }),
  );
});
it("shows six incoming choices and saves the confirmed work/sales payment as income", async () => {
  setup([row("incoming", "credit")]);
  await render(<GroupedReview statementId="s1" />);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Select a category" }),
    ).toBeTruthy(),
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Select a category" }),
  );
  for (const label of [
    "Income",
    "Gift or family support",
    "Borrowed money",
    "Repayment or reimbursement",
    "Refund",
    "Transfer to my own account",
  ])
    expect(screen.getByRole("radio", { name: label })).toBeTruthy();
  await fireEvent.press(screen.getByRole("radio", { name: "Income" }));
  await fireEvent.press(
    screen.getByRole("button", { name: "Save selected answers" }),
  );
  await waitFor(() =>
    expect(confirmTransactionGroup).toHaveBeenCalledWith(
      [{ transactionId: "incoming", revision: 1 }],
      "income",
      undefined,
    ),
  );
});
it("shows the future rule scope and saves one rule for a whole matching group", async () => {
  setup([row("one"), row("two")], true);
  await render(<GroupedReview statementId="s1" />);
  await choose("Housing");
  expect(await screen.findByText(/containing: RENT/)).toBeTruthy();
  await fireEvent.press(
    screen.getByRole("checkbox", { name: "Remember matching payments" }),
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Save selected answers" }),
  );
  await waitFor(() =>
    expect(confirmTransactionGroup).toHaveBeenCalledWith(
      [
        { transactionId: "one", revision: 1 },
        { transactionId: "two", revision: 1 },
      ],
      "housing",
      expect.objectContaining({
        narrationTokens: ["RENT"],
        minAmount: "100.00",
        maxAmount: "100.00",
      }),
    ),
  );
});
it("excludes deselected rows and disables future memory for a partial group", async () => {
  setup([row("one"), row("two")], true);
  await render(<GroupedReview statementId="s1" />);
  await expand(2);
  await choose("Housing");
  await fireEvent.press(
    screen.getByRole("checkbox", { name: "Include TRANSFER RENT two" }),
  );
  expect(
    screen.queryByRole("checkbox", { name: "Remember matching payments" }),
  ).toBeNull();
  await fireEvent.press(
    screen.getByRole("button", { name: "Save selected answers" }),
  );
  await waitFor(() =>
    expect(confirmTransactionGroup).toHaveBeenCalledWith(
      [{ transactionId: "one", revision: 1 }],
      "housing",
      undefined,
    ),
  );
});
it("loads additional group members while limiting explicit selection to 100 rows", async () => {
  const rows = Array.from({ length: 101 }, (_, i) => row(String(i)));
  setup(rows);
  jest
    .mocked(reviewGroupMembers)
    .mockResolvedValueOnce({ items: rows.slice(0, 100), nextCursor: "99" })
    .mockResolvedValueOnce({ items: rows.slice(100), nextCursor: null });
  await render(<GroupedReview statementId="s1" />);
  await expand(101);
  await fireEvent.press(
    screen.getByRole("button", { name: "Load more matching transactions" }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("checkbox", { name: "Include TRANSFER RENT 100" }),
    ).toBeTruthy(),
  );
  expect(
    screen.getByRole("checkbox", { name: "Include TRANSFER RENT 100" }).props
      .accessibilityState.checked,
  ).toBe(false);
  await choose("Housing");
  await fireEvent.press(
    screen.getByRole("button", { name: "Save selected answers" }),
  );
  await waitFor(() =>
    expect(jest.mocked(confirmTransactionGroup).mock.calls[0][0]).toHaveLength(
      100,
    ),
  );
});
it("reloads revisions after a failed save and keeps the error visible", async () => {
  setup([row("one")]);
  jest
    .mocked(confirmTransactionGroup)
    .mockRejectedValueOnce(new Error("REVISION_CONFLICT"));
  await render(<GroupedReview statementId="s1" />);
  await choose("Housing");
  await fireEvent.press(
    screen.getByRole("button", { name: "Save selected answers" }),
  );
  await waitFor(() => expect(listReviewGroups).toHaveBeenCalledTimes(2));
  expect(
    screen.getByText("This transaction changed. Reloaded your review."),
  ).toBeTruthy();
});
it("supports correcting an already accepted classification", async () => {
  jest
    .mocked(getTransaction)
    .mockResolvedValue({
      ...row("accepted"),
      category: "utilities",
      status: "auto_classified",
    });
  await render(<GroupedReview statementId="s1" transactionId="accepted" />);
  await choose("Business expenses");
  await fireEvent.press(
    screen.getByRole("button", { name: "Save selected answers" }),
  );
  await waitFor(() =>
    expect(confirmTransactionGroup).toHaveBeenCalledWith(
      [{ transactionId: "accepted", revision: 1 }],
      "business_expenses",
      undefined,
    ),
  );
});
