import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { TransactionStreamEvent, TransactionsResponse } from '../api/transactions';
import {
  getCashflowTransactionsQueryKey,
  getTransactionExplorerQueryKey,
} from '../queryKeys/transactions';
import { isDateWithinRange } from '../utils/date';

type TransactionExplorerUpdateType = 'added' | 'deleted' | 'updated';

type UseTransactionEventHandlerParams = {
  cashflowWindowFrom: string;
  cashflowWindowTo: string;
  from: string;
  onCashflowAffected: () => void;
  onTransactionExplorerAffected: (type: TransactionExplorerUpdateType) => void;
  selectedUserId: string | null;
  to: string;
};

export const useTransactionEventHandler = ({
  cashflowWindowFrom,
  cashflowWindowTo,
  from,
  onCashflowAffected,
  onTransactionExplorerAffected,
  selectedUserId,
  to,
}: UseTransactionEventHandlerParams) => {
  const queryClient = useQueryClient();

  return useCallback(
    (streamEvent: TransactionStreamEvent) => {
      if (!selectedUserId || !cashflowWindowFrom || !cashflowWindowTo) {
        return;
      }

      const event = streamEvent.data;

      const cashflowQueryKey = getCashflowTransactionsQueryKey(
        selectedUserId,
        cashflowWindowFrom,
        cashflowWindowTo,
      );
      const transactionExplorerQueryKey = getTransactionExplorerQueryKey(selectedUserId, from, to);

      if (event.type === 'TRANSACTION_DELETED') {
        const currentData = queryClient.getQueryData<TransactionsResponse>(cashflowQueryKey);
        const currentExplorerData =
          queryClient.getQueryData<TransactionsResponse>(transactionExplorerQueryKey);

        if (!event.transaction_id) {
          return;
        }

        const transactionExistsInCashflowWindow = currentData?.transactions.some(
          (transaction) => transaction.id === event.transaction_id,
        );
        const transactionExistsInExplorer = currentExplorerData?.transactions.some(
          (transaction) => transaction.id === event.transaction_id,
        );

        if (currentData && transactionExistsInCashflowWindow) {
          queryClient.setQueryData<TransactionsResponse>(cashflowQueryKey, {
            ...currentData,
            total: Math.max(0, currentData.total - 1),
            transactions: currentData.transactions.filter(
              (transaction) => transaction.id !== event.transaction_id,
            ),
          });
          onCashflowAffected();
        }

        if (currentExplorerData && transactionExistsInExplorer) {
          queryClient.setQueryData<TransactionsResponse>(transactionExplorerQueryKey, {
            ...currentExplorerData,
            total: Math.max(0, currentExplorerData.total - 1),
            transactions: currentExplorerData.transactions.filter(
              (transaction) => transaction.id !== event.transaction_id,
            ),
          });
          onTransactionExplorerAffected('deleted');
        }

        return;
      }

      if (!event.transaction) {
        return;
      }

      const eventTransaction = event.transaction;
      const isCurrentUserEvent = eventTransaction.user_id === selectedUserId;
      const isTransactionExplorerWindowEvent = isDateWithinRange(eventTransaction.date, from, to);
      const isCashflowWindowEvent = isDateWithinRange(
        eventTransaction.date,
        cashflowWindowFrom,
        cashflowWindowTo,
      );

      if (!isCurrentUserEvent) {
        return;
      }

      if (isTransactionExplorerWindowEvent) {
        const currentExplorerData =
          queryClient.getQueryData<TransactionsResponse>(transactionExplorerQueryKey);

        if (currentExplorerData) {
          const transactionExists = currentExplorerData.transactions.some(
            (transaction) => transaction.id === eventTransaction.id,
          );

          if (event.type === 'TRANSACTION_ADDED') {
            const nextExplorerData = transactionExists
              ? {
                  ...currentExplorerData,
                  transactions: currentExplorerData.transactions.map((transaction) =>
                    transaction.id === eventTransaction.id ? eventTransaction : transaction,
                  ),
                }
              : {
                  ...currentExplorerData,
                  total: currentExplorerData.total + 1,
                  transactions: [...currentExplorerData.transactions, eventTransaction],
                };

            queryClient.setQueryData<TransactionsResponse>(
              transactionExplorerQueryKey,
              nextExplorerData,
            );
            onTransactionExplorerAffected('added');
          }

          if (event.type === 'TRANSACTION_UPDATED') {
            const nextExplorerData = transactionExists
              ? {
                  ...currentExplorerData,
                  transactions: currentExplorerData.transactions.map((transaction) =>
                    transaction.id === eventTransaction.id ? eventTransaction : transaction,
                  ),
                }
              : {
                  ...currentExplorerData,
                  total: currentExplorerData.total + 1,
                  transactions: [...currentExplorerData.transactions, eventTransaction],
                };

            queryClient.setQueryData<TransactionsResponse>(
              transactionExplorerQueryKey,
              nextExplorerData,
            );
            onTransactionExplorerAffected('updated');
          }
        }
      }

      if (!isCashflowWindowEvent) {
        return;
      }

      queryClient.setQueryData<TransactionsResponse>(cashflowQueryKey, (currentData) => {
        if (!currentData) {
          return currentData;
        }

        if (event.type === 'TRANSACTION_ADDED') {
          return {
            ...currentData,
            total: currentData.total + 1,
            transactions: [...currentData.transactions, eventTransaction],
          };
        }

        if (event.type === 'TRANSACTION_UPDATED') {
          return {
            ...currentData,
            transactions: currentData.transactions.map((transaction) =>
              transaction.id === eventTransaction.id ? eventTransaction : transaction,
            ),
          };
        }

        return currentData;
      });
      onCashflowAffected();
    },
    [
      cashflowWindowFrom,
      cashflowWindowTo,
      from,
      onCashflowAffected,
      onTransactionExplorerAffected,
      queryClient,
      selectedUserId,
      to,
    ],
  );
};
