import React from "react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { router } from "expo-router";
import { Home } from "../src/screens/Home";
import { useAppState } from "../src/lib/AppProvider";
import { ApiError } from "../src/lib/session";
import { session, Statement, uploadStatement } from "../src/lib/api";
jest.mock("expo-document-picker", () => ({ getDocumentAsync: jest.fn() }));
jest.mock("../src/lib/AppProvider", () => ({ useAppState: jest.fn() }));
jest.mock("expo-file-system", () => ({
  Paths: { cache: { uri: "file:///cache/" } },
  File: jest.fn().mockImplementation(() => ({
    exists: true,
    size: 1024,
    delete: jest.fn(),
  })),
}));
jest.mock("../src/lib/api", () => ({
  session: {
    user: { firstName: "Chidera", email: "chidera@example.test" },
    accessToken: jest.fn(),
    request: jest.fn(),
    clear: jest.fn(),
    logout: jest.fn(),
    deleteAccount: jest.fn(),
  },
  uploadStatement: jest.fn(),
  normalizeTransaction: (raw: { id?: string; transactionId?: string }) => ({
    ...raw,
    id: raw.id ?? raw.transactionId,
    revision: 0,
  }),
  messageFor: () => "Please select your PDF and try again.",
}));
const picker = jest.mocked(DocumentPicker.getDocumentAsync);
const uploader = jest.mocked(uploadStatement);
const request = jest.mocked(session.request);
const appState = {
  user: {
    userId: "u1",
    firstName: "Chidera",
    email: "chidera@example.test",
    emailVerifiedAt: null,
  },
  seen: true,
  activeStatementId: null as string | null,
  saveActiveStatement: jest.fn(async () => {}),
  clearActiveStatement: jest.fn(async () => {}),
  completeOnboarding: async () => {},
};
async function select() {
  await fireEvent.press(
    screen.getByRole("button", { name: "Analyse my statement" }),
  );
  await fireEvent.press(screen.getByRole("button", { name: "Browse files" }));
  await waitFor(() => expect(screen.getByText("Statement.pdf")).toBeTruthy());
}
describe("Statement flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    uploader.mockReset();
    request.mockReset();
    appState.activeStatementId = null;
    jest.mocked(useAppState).mockReturnValue(appState);
    picker.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///cache/statement.pdf",
          name: "Statement.pdf",
          size: 1024,
          mimeType: "application/pdf",
          lastModified: 0,
        },
      ],
    });
    jest.mocked(session.accessToken).mockResolvedValue("access");
  });
  it("shows actual transfer progress, analysis, partial results, and cursor pagination", async () => {
    let finish!: (result: Statement) => void;
    let transferred!: () => void;
    uploader.mockImplementation((_file, _token, progress, sent) => {
      progress(73);
      transferred = sent;
      return {
        promise: new Promise((resolve) => {
          finish = resolve;
        }),
        cancel: jest.fn(),
      };
    });
    request
      .mockResolvedValueOnce({
        items: [
          {
            id: "t1",
            date: "2026-10-15",
            description: "SPAR",
            amount: "1234.50",
            direction: "debit",
            currency: "NGN",
            status: "auto_classified",
            category: "groceries",
            revision: 2,
            classification: { status: "auto_classified", reviewRequired: false },
          },
        ],
        nextCursor: "t1",
      })
      .mockResolvedValueOnce({ transactionCount: 2, unresolvedTransactionCount: 0,
        classificationCoverage: 1, classifiedExpenseAmount: '1234.50', unclassifiedDebitAmount: '0.00',
        unclassifiedCreditAmount: '0.00', analysisComplete: false })
      .mockResolvedValueOnce({
        items: [
          {
            id: "t2",
            date: "2026-10-16",
            description: "PAYMENT",
            amount: "500.00",
            direction: "credit",
            currency: "NGN",
            status: "auto_classified",
            category: "income",
            revision: 3,
            classification: { status: "auto_classified", reviewRequired: false },
          },
        ],
        nextCursor: null,
      });
    await render(<Home />);
    await select();
    await fireEvent.press(screen.getByRole("button", { name: "Analyse" }));
    await waitFor(() => expect(screen.getByText("73%")).toBeTruthy());
    await act(async () => transferred());
    await waitFor(() => expect(screen.getByText("Analysing…")).toBeTruthy());
    await act(async () => {
      finish({
        id: "s1",
        status: "needs_review",
        errorCode: "INVALID_ROWS_REUPLOAD_REQUIRED",
        classificationStatus: "processed",
        documentRetained: false,
      });
    });
    await waitFor(() => expect(screen.getByText("SPAR")).toBeTruthy());
    expect(appState.saveActiveStatement).toHaveBeenCalledWith("s1");
    expect(screen.getByText(/could not be fully verified/)).toBeTruthy();
    expect(screen.getByText("−₦1,234.50")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Load more" }));
    await waitFor(() => expect(screen.getByText("PAYMENT")).toBeTruthy());
    expect(request).toHaveBeenLastCalledWith(
      "/moneylens/statements/s1/transactions?cursor=t1",
    );
    expect(
      jest
        .mocked(File)
        .mock.results.some(
          (result) =>
            result.type === "return" &&
            result.value.delete.mock.calls.length > 0,
        ),
    ).toBe(true);
  });
  it("refreshes the results list after returning from review", async () => {
    let transactionCalls = 0;
    const respond = async (path: string): Promise<unknown> => {
      if (path === "/moneylens/statements/s1") {
        return {
          id: "s1",
          status: "extracted",
          errorCode: null,
          classificationStatus: "processed",
          documentRetained: false,
        } satisfies Statement;
      }
      if (path.startsWith("/moneylens/classification/summary")) {
        const reviewed = transactionCalls > 1;
        return { transactionCount: 1, unresolvedTransactionCount: reviewed ? 0 : 1,
          classificationCoverage: reviewed ? 1 : 0, classifiedExpenseAmount: reviewed ? '15000.00' : '0.00',
          unclassifiedDebitAmount: reviewed ? '0.00' : '15000.00', unclassifiedCreditAmount: '0.00', analysisComplete: reviewed };
      }
      if (path === "/moneylens/statements/s1/transactions") {
        const reviewed = transactionCalls++ > 0;
        return {
          items: [
            {
              transactionId: "t1",
              date: "2026-10-15",
              description: "TRANSFER",
              amount: "15000.00",
              direction: "debit",
              currency: "NGN",
              status: reviewed ? "auto_classified" : "requires_user_tagging",
              category: reviewed ? "groceries" : "transfer_unknown",
              revision: reviewed ? 5 : 4,
              classification: {
                status: reviewed ? "auto_classified" : "requires_user_tagging",
                reviewRequired: !reviewed,
              },
            },
          ],
          nextCursor: null,
        };
      }
      throw new Error(`Unexpected request: ${path}`);
    };
    request.mockImplementation(respond as never);
    await render(<Home />);
    await act(async () => {
      router.setParams({ view: "results", statementId: "s1", reviewed: "" });
    });
    await waitFor(() =>
      expect(screen.getByText(/1 transaction needs your review/)).toBeTruthy(),
    );
    expect(screen.getByText(/Needs review/)).toBeTruthy();

    await act(async () => {
      router.setParams({ view: "results", statementId: "s1", reviewed: "1" });
    });
    await waitFor(() =>
      expect(screen.queryByText(/needs your review/)).toBeNull(),
    );
    expect(screen.getByText(/Groceries/)).toBeTruthy();
  });
  it("opens results with optional review when processed rows still need review", async () => {
    uploader.mockImplementation((_file, _token, progress, sent) => {
      progress(100);
      sent();
      return {
        promise: Promise.resolve({
          id: "s2",
          status: "extracted",
          errorCode: null,
          classificationStatus: "processed",
          documentRetained: false,
        }),
        cancel: jest.fn(),
      };
    });
    request.mockResolvedValueOnce({
      items: [
        {
          transactionId: "t1",
          date: "2026-10-15",
          description: "TRANSFER",
          amount: "15000.00",
          direction: "debit",
          currency: "NGN",
          status: "requires_user_tagging",
          category: "transfer_unknown",
          revision: 4,
          classification: {
            status: "requires_user_tagging",
            reviewRequired: true,
          },
        },
      ],
      nextCursor: null,
    }).mockResolvedValueOnce({ transactionCount: 1, unresolvedTransactionCount: 1,
      reviewableTransactionCount: 1, classificationCoverage: 0, classifiedExpenseAmount: '0.00',
      unclassifiedDebitAmount: '15000.00', unclassifiedCreditAmount: '0.00', analysisComplete: false });
    await render(<Home />);
    await select();
    await fireEvent.press(screen.getByRole("button", { name: "Analyse" }));
    await waitFor(() => expect(screen.getByText(/1 transaction needs your review/)).toBeTruthy());
    expect(router.push).not.toHaveBeenCalledWith(expect.objectContaining({ pathname: '/review' }));
    expect(screen.getByRole('button', { name: 'Review transactions' })).toBeTruthy();
    expect(screen.queryByText("Unable to read statement")).toBeNull();
  });
  it("cancels an active upload and removes the app-owned PDF copy", async () => {
    const cancel = jest.fn();
    uploader.mockReturnValue({ promise: new Promise(() => {}), cancel });
    await render(<Home />);
    await select();
    await fireEvent.press(screen.getByRole("button", { name: "Analyse" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Cancel upload" }),
      ).toBeTruthy(),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Cancel upload" }),
    );
    expect(cancel).toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Browse files" })).toBeTruthy(),
    );
  });
  it("keeps the bottom navigation available and cancels transfer when returning Home", async () => {
    const cancel = jest.fn();
    uploader.mockReturnValue({ promise: new Promise(() => {}), cancel });
    await render(<Home />);
    await select();
    await fireEvent.press(screen.getByRole("button", { name: "Analyse" }));
    await waitFor(() => expect(uploader).toHaveBeenCalled());
    await fireEvent.press(screen.getByRole("button", { name: "Home" }));
    expect(cancel).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText("Hi Chidera!")).toBeTruthy());
    await fireEvent.press(screen.getByRole("button", { name: "Profile" }));
    expect(router.push).toHaveBeenCalledWith("/profile");
  });
  it("shows extraction failure and requires selecting a fresh file to retry", async () => {
    uploader.mockReturnValue({
      promise: Promise.reject(new Error("unreadable")),
      cancel: jest.fn(),
    });
    await render(<Home />);
    await select();
    await fireEvent.press(screen.getByRole("button", { name: "Analyse" }));
    await waitFor(() =>
      expect(screen.getByText("Unable to read statement")).toBeTruthy(),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(picker).toHaveBeenCalledTimes(2));
  });
  it("clears a previous failure before a new analysis starts", async () => {
    uploader.mockReturnValue({
      promise: Promise.reject(new Error("unreadable")),
      cancel: jest.fn(),
    });
    await render(<Home />);
    await select();
    await fireEvent.press(screen.getByRole("button", { name: "Analyse" }));
    await waitFor(() =>
      expect(screen.getByText("Unable to read statement")).toBeTruthy(),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Home" }));
    await waitFor(() => expect(screen.getByText("Hi Chidera!")).toBeTruthy());

    let transferred!: () => void;
    uploader.mockImplementation((_file, _token, progress, sent) => {
      progress(100);
      transferred = sent;
      return { promise: new Promise(() => {}), cancel: jest.fn() };
    });
    await fireEvent.press(
      screen.getByRole("button", { name: "Analyse my statement" }),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Browse files" }));
    await waitFor(() => expect(screen.getByText("Statement.pdf")).toBeTruthy());
    await fireEvent.press(screen.getByRole("button", { name: "Analyse" }));
    await act(async () => transferred());
    await waitFor(() => expect(screen.getByText("Analysing…")).toBeTruthy());
    expect(screen.queryByText("Unable to read statement")).toBeNull();
  });
  it("rejects oversized PDFs without uploading", async () => {
    picker.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///cache/big.pdf",
          name: "Big.pdf",
          size: 21 * 1024 * 1024,
          mimeType: "application/pdf",
          lastModified: 0,
        },
      ],
    });
    await render(<Home />);
    await fireEvent.press(
      screen.getByRole("button", { name: "Analyse my statement" }),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Browse files" }));
    await waitFor(() =>
      expect(
        screen.getByText("Choose a non-empty PDF smaller than 20 MB."),
      ).toBeTruthy(),
    );
    expect(uploader).not.toHaveBeenCalled();
  });
});
