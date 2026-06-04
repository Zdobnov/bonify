import type { Transaction } from '../api/transactions';

export type SortDirection = 'asc' | 'desc';
export type SortKey = 'date' | 'merchant_name' | 'amount' | 'type';
export type TransactionExplorerUpdateSummary = {
  added: number;
  deleted: number;
  key: number;
  updated: number;
};

export const getUpdateSummaryText = (summary: TransactionExplorerUpdateSummary) => {
  const changedTransactionsCount = summary.added + summary.deleted + summary.updated;
  const parts = [
    summary.added > 0 ? `${summary.added} added` : null,
    summary.deleted > 0 ? `${summary.deleted} deleted` : null,
    summary.updated > 0 ? `${summary.updated} updated` : null,
  ].filter(Boolean);

  return `${parts.join(', ')} transaction${changedTransactionsCount === 1 ? '' : 's'}`;
};

export const formatAmount = (transaction: Transaction) => {
  return new Intl.NumberFormat('en-US', {
    currency: transaction.currency,
    style: 'currency',
  }).format(transaction.amount);
};

export const getSortIndicator = (
  columnKey: SortKey,
  sortKey: SortKey,
  sortDirection: SortDirection,
) => {
  if (columnKey !== sortKey) {
    return null;
  }

  return sortDirection === 'asc' ? '↑' : '↓';
};
