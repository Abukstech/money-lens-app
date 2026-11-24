import type { Transaction } from "./api";

export const CATEGORY_LABELS: Record<string, string> = {
  groceries: "Groceries",
  dining: "Food & dining",
  housing: "Housing",
  utilities: "Utilities",
  transport: "Transport",
  telecommunications: "Airtime & data",
  healthcare: "Healthcare",
  education: "Education",
  shopping: "Shopping",
  entertainment: "Entertainment",
  subscriptions: "Subscriptions",
  travel: "Travel",
  personal_care: "Personal care",
  family_support: "Family support",
  donations_gifts: "Donations & gifts",
  business_expenses: "Business expenses",
  savings: "Savings",
  investments: "Investments",
  debt_repayment: "Debt repayment",
  financial_fees: "Bank fees & levies",
  insurance: "Insurance",
  taxes: "Taxes",
  gambling: "Gambling",
  cash_withdrawal: "Cash withdrawal",
  internal_transfer: "Transfer to my own account",
  income: "Income",
  gift_received: "Gift or family support",
  loan_received: "Borrowed money",
  repayment_received: "Repayment or reimbursement",
  refund: "Refund",
  other: "Other",
};

export function categoryLabel(id?: string | null): string {
  if (!id) return "Uncategorised";
  return CATEGORY_LABELS[id] ?? id.replace(/_/g, " ");
}

export function transactionNeedsCorrection(transaction: Transaction): boolean {
  return (transaction.validationIssues?.length ?? 0) > 0;
}

export function transactionNeedsReview(transaction: Transaction): boolean {
  if (transactionNeedsCorrection(transaction)) return false;
  return (
    transaction.classification?.reviewRequired === true ||
    transaction.category === "unknown" ||
    transaction.category === "transfer_unknown"
  );
}

export function reviewQuestionsNeeded(transactions: Transaction[]): number {
  return transactions.filter(transactionNeedsReview).length;
}
