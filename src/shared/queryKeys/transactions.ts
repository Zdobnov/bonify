export const getCashflowTransactionsQueryKey = (
  userId: string,
  from: string,
  to: string,
) => ['cashflow-transactions', userId, from, to] as const;

export const getTransactionExplorerQueryKey = (
  userId: string,
  from: string,
  to: string,
) => ['user-transactions', userId, from, to] as const;
