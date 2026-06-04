import { API_BASE_URL } from '../config/api';

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
  page: number;
  limit: number;
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

  return response.json();
};
