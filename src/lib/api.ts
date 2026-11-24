import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { Session, ApiError } from "./session";

const baseUrl = (
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === "android"
    ? "http://10.0.2.2:3000/api"
    : "http://localhost:3000/api")
).replace(/\/$/, "");
// Web sessions stay in memory. Native credentials use the OS secure store.
const webSessionStore = new Map<string, string>();
export const session = new Session(
  baseUrl,
  Platform.OS === "web"
    ? {
        getItem: async (key) => webSessionStore.get(key) ?? null,
        setItem: async (key, value) => {
          webSessionStore.set(key, value);
        },
        deleteItem: async (key) => {
          webSessionStore.delete(key);
        },
      }
    : {
        getItem: SecureStore.getItemAsync,
        setItem: SecureStore.setItemAsync,
        deleteItem: SecureStore.deleteItemAsync,
      },
);
const messages: Record<string, string> = {
  NETWORK_ERROR: "We couldn’t connect. Check your connection and try again.",
  INVALID_CREDENTIALS: "That email and password don’t match. Please try again.",
  ACCOUNT_UNAVAILABLE: "This account can’t be created. Try signing in instead.",
  INVALID_OR_EXPIRED_CODE:
    "That code is incorrect or has expired. Request a new code.",
  INVALID_OR_EXPIRED_GRANT:
    "Your verification has expired. Please verify your email again.",
  CODE_RATE_LIMITED: "Please wait before requesting another code.",
  EMAIL_NOT_CONFIGURED:
    "Email verification is not available yet. Please try again later.",
  EMAIL_DELIVERY_FAILED:
    "We couldn’t send your code. Please try again in a minute.",
  UNAUTHORIZED: "Your session has ended. Please sign in again.",
  INVALID_REQUEST: "Check your details and try again.",
  OCR_NOT_CONFIGURED:
    "Statement analysis is not available yet. Please try again later.",
  PROVIDER_PRIVACY_EVIDENCE_REQUIRED:
    "Statement analysis is not available yet. Please try again later.",
  PROCESSING_NOT_AUTHORIZED:
    "Statement analysis is not available yet. Please try again later.",
  UPLOAD_TOO_LARGE: "Choose a PDF smaller than 20 MB.",
  UNSUPPORTED_DOCUMENT: "Choose a valid PDF bank statement.",
  NO_VALID_TRANSACTIONS:
    "We couldn’t read transactions in this PDF. Try another statement.",
  EXTRACTION_FAILED_REUPLOAD_REQUIRED:
    "We weren’t able to extract the transactions from this file. Try another statement or check that your PDF is supported.",
  IMPORT_IN_PROGRESS:
    "This statement is already being processed. Please try again shortly.",
  UPLOAD_CANCELLED: "Upload cancelled. Select your statement to try again.",
  REVISION_CONFLICT:
    "This transaction changed while you were reviewing. Reload and try again.",
  EXTRACTION_CORRECTION_REQUIRED:
    "This row needs a corrected statement before it can be classified.",
  CATEGORY_DIRECTION_CONFLICT:
    "That category does not match whether money came in or went out.",
  TRANSACTION_NOT_FOUND: "That transaction is no longer available.",
};
export function messageFor(error: unknown) {
  return error instanceof ApiError
    ? (messages[error.code] ?? "Something went wrong. Please try again.")
    : "Something went wrong. Please try again.";
}
export type Statement = {
  id: string;
  status: string;
  errorCode: string | null;
  classificationStatus: string;
  documentRetained: false;
};
export type Transaction = {
  id: string;
  transactionId?: string;
  statementId?: string;
  revision: number;
  date: string;
  description: string;
  amount: string;
  direction: string;
  currency: string;
  status: string;
  category: string;
  suggestedCategory?: string | null;
  validationIssues?: string[];
  merchant?: { name: string } | null;
  classification?: {
    status: string;
    source?: string;
    confidence?: number | null;
    reviewRequired?: boolean;
    reasonCode?: string | null;
    memoryEligible?: boolean;
  };
};
export type TransactionPage = { items: Transaction[]; nextCursor: string | null };
export type RawTransaction = Omit<Transaction, "id" | "revision"> & {
  id?: string;
  transactionId?: string;
  revision?: number;
};
export function normalizeTransaction(raw: RawTransaction): Transaction {
  return {
    ...raw,
    id: raw.id ?? raw.transactionId ?? "",
    revision: raw.revision ?? 0,
  };
}
export type CategoryOption = { id: string; definition: string };
export type Page = { items: Transaction[]; nextCursor: string | null };
export type Purpose = "registration" | "password_reset";
export type Challenge = {
  challengeId: string;
  expiresIn: number;
  resendAfter: number;
};
export function uploadStatement(
  file: { uri: string; name: string; webFile?: File },
  token: string,
  onProgress: (progress: number) => void,
  onTransferringDone: () => void,
) {
  const xhr = new XMLHttpRequest();
  const promise = new Promise<Statement>((resolve, reject) => {
    xhr.open("POST", `${baseUrl}/moneylens/statements/extract`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.timeout = 150000;
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable)
        onProgress(
          Math.min(100, Math.round((event.loaded / event.total) * 100)),
        );
    };
    xhr.upload.onload = onTransferringDone;
    xhr.onerror = () => reject(new ApiError("NETWORK_ERROR"));
    xhr.ontimeout = () =>
      reject(new ApiError("EXTRACTION_FAILED_REUPLOAD_REQUIRED"));
    xhr.onabort = () => reject(new ApiError("UPLOAD_CANCELLED"));
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(new ApiError(data.code ?? "REQUEST_FAILED", xhr.status));
      } catch {
        reject(new ApiError("REQUEST_FAILED"));
      }
    };
    const form = new FormData();
    if (file.webFile) form.append("document", file.webFile, file.name);
    else
      form.append("document", {
        uri: file.uri,
        name: file.name,
        type: "application/pdf",
      } as unknown as Blob);
    xhr.send(form);
  });
  return { promise, cancel: () => xhr.abort() };
}
export async function statementTransactions(
  statementId: string,
  maxPages = 20,
): Promise<Transaction[]> {
  const items: Transaction[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < maxPages; page++) {
    const path: string = `/moneylens/statements/${statementId}/transactions${
      cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""
    }`;
    const result: Page = await session.request<Page>(path);
    items.push(...result.items.map(normalizeTransaction));
    if (!result.nextCursor) break;
    cursor = result.nextCursor;
  }
  return items;
}
export async function listCategories(): Promise<CategoryOption[]> {
  const result = await session.request<{ categories: CategoryOption[] }>(
    "/moneylens/classification/categories",
  );
  return result.categories ?? [];
}
export function confirmTransactionCategory(
  transactionId: string,
  revision: number,
  category: string,
) {
  return session.request(
    `/moneylens/transactions/${transactionId}/classification`,
    { revision, category },
    "PATCH",
  );
}

export type RuleConditions = {
  direction: string; currency: string; minAmount: string; maxAmount: string; narrationTokens: string[];
};
export type ReviewGroup = {
  key: string; count: number; direction: string; currency: string; totalAmount: string;
  suggestedCategory: string | null; previews: Transaction[]; memoryEligible: boolean;
  proposedConditions: RuleConditions | null;
};
export type ReviewGroupsPage = {
  items: ReviewGroup[]; nextCursor: string | null; transactionCount: number; groupCount: number;
};
export type ClassificationSummary = {
  transactionCount: number; unresolvedTransactionCount: number; reviewableTransactionCount?: number;
  classifiedExpenseAmount: string; unclassifiedDebitAmount: string;
  unclassifiedCreditAmount: string; classificationCoverage: number; analysisComplete: boolean;
};
export async function listReviewGroups(statementId: string, cursor?: string | null): Promise<ReviewGroupsPage> {
  const page = await session.request<ReviewGroupsPage>(
    `/moneylens/classification/review-groups?statementId=${encodeURIComponent(statementId)}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
  );
  return { ...page, items: page.items.map(group => ({
    ...group, previews: group.previews.map(normalizeTransaction),
  })) };
}
export async function reviewGroupMembers(statementId: string, key: string, cursor?: string | null): Promise<Page> {
  const page = await session.request<Page>(
    `/moneylens/classification/review-groups/${encodeURIComponent(key)}/transactions?statementId=${encodeURIComponent(statementId)}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
  );
  return { ...page, items: page.items.map(normalizeTransaction) };
}
export async function getTransaction(id: string): Promise<Transaction> {
  return normalizeTransaction(await session.request<RawTransaction>(`/moneylens/transactions/${encodeURIComponent(id)}`));
}
export function confirmTransactionGroup(items: { transactionId: string; revision: number }[], category: string,
  conditions?: RuleConditions) {
  return session.request('/moneylens/transactions/classification/bulk', {
    items, category, rememberForFuture: !!conditions, ...(conditions ? { conditions } : {}),
  }, 'POST');
}
