import { API_BASE_URL } from '../config/api';
import { isValidDateString } from '../utils/date';

type GetUserTransactionsParams = {
  from: string;
  limit?: number;
  page?: number;
  to: string;
  userId: string;
};

export type Transaction = {
  id: string;
  account_id: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  merchant_category_code: string;
  merchant_name: string;
  type: 'debit' | 'credit';
  user_id: string;
  synced_at: string;
};

export type TransactionsResponse = {
  transactions: Transaction[];
  total: number;
  page?: number;
  limit?: number;
  total_pages?: number;
  has_more: boolean;
};

export type TransactionEventType =
  | 'TRANSACTION_ADDED'
  | 'TRANSACTION_UPDATED'
  | 'TRANSACTION_DELETED';

export type TransactionEvent = {
  type: TransactionEventType;
  transaction?: Transaction;
  transaction_id?: string;
};

export type TransactionStreamEvent = {
  data: TransactionEvent;
  event: TransactionEventType;
  id: string | null;
};

const normalizeNumber = (value: unknown, fallback = 0) => {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
};

const normalizeString = (value: unknown) => {
  return typeof value === 'string' ? value : '';
};

const normalizeTransactionType = (value: unknown, amount: number): Transaction['type'] => {
  if (value === 'debit' || value === 'credit') {
    return value;
  }

  return amount < 0 ? 'debit' : 'credit';
};

const normalizeTransaction = (payload: Partial<Transaction>): Transaction | null => {
  const amount = normalizeNumber(payload.amount, Number.NaN);
  const date = normalizeString(payload.date);
  const id = normalizeString(payload.id);
  const userId = normalizeString(payload.user_id);

  if (!id || !userId || !Number.isFinite(amount) || !isValidDateString(date)) {
    return null;
  }

  return {
    account_id: normalizeString(payload.account_id),
    amount,
    currency: normalizeString(payload.currency) || 'EUR',
    date,
    description: normalizeString(payload.description),
    id,
    merchant_category_code: normalizeString(payload.merchant_category_code),
    merchant_name: normalizeString(payload.merchant_name) || 'Unknown merchant',
    synced_at: normalizeString(payload.synced_at),
    type: normalizeTransactionType(payload.type, amount),
    user_id: userId,
  };
};

export const normalizeTransactionsResponse = (
  payload: Partial<TransactionsResponse>,
): TransactionsResponse => {
  const transactions = Array.isArray(payload.transactions)
    ? payload.transactions
        .map((transaction) => normalizeTransaction(transaction))
        .filter((transaction): transaction is Transaction => Boolean(transaction))
    : [];

  return {
    has_more: Boolean(payload.has_more),
    limit: typeof payload.limit === 'number' ? payload.limit : undefined,
    page: typeof payload.page === 'number' ? payload.page : undefined,
    total: typeof payload.total === 'number' ? payload.total : transactions.length,
    total_pages: typeof payload.total_pages === 'number' ? payload.total_pages : undefined,
    transactions,
  };
};

export const getUserTransactions = async ({
  from,
  limit,
  page,
  to,
  userId,
}: GetUserTransactionsParams): Promise<TransactionsResponse> => {
  const searchParams = new URLSearchParams({ from, to });

  if (page) {
    searchParams.set('page', String(page));
  }

  if (limit) {
    searchParams.set('limit', String(limit));
  }

  const response = await fetch(
    `${API_BASE_URL}/api/users/${userId}/transactions?${searchParams.toString()}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to load transactions: ${response.status}`);
  }

  return normalizeTransactionsResponse(await response.json());
};
