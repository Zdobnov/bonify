import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { TransactionStreamEvent, TransactionsResponse } from '../api/transactions';
import {
  getCashflowTransactionsQueryKey,
  getTransactionExplorerQueryKey,
} from '../queryKeys/transactions';
import {
  applyTransactionEventToTransactions,
  getTransactionStreamEventDeduplicationKey,
  type TransactionEventUpdateType,
} from '../utils/transactionEventReducer';

type UseTransactionEventHandlerParams = {
  cashflowWindowFrom: string;
  cashflowWindowTo: string;
  from: string;
  onCashflowAffected: () => void;
  onTransactionExplorerAffected: (type: TransactionEventUpdateType) => void;
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
  const processedEventKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    processedEventKeysRef.current.clear();
  }, [cashflowWindowFrom, cashflowWindowTo, from, selectedUserId, to]);

  return useCallback(
    (streamEvent: TransactionStreamEvent) => {
      if (!selectedUserId || !cashflowWindowFrom || !cashflowWindowTo) {
        return;
      }

      const eventDeduplicationKey = getTransactionStreamEventDeduplicationKey(streamEvent);

      if (
        eventDeduplicationKey &&
        processedEventKeysRef.current.has(eventDeduplicationKey)
      ) {
        return;
      }

      const cashflowQueryKey = getCashflowTransactionsQueryKey(
        selectedUserId,
        cashflowWindowFrom,
        cashflowWindowTo,
      );
      const transactionExplorerQueryKey = getTransactionExplorerQueryKey(selectedUserId, from, to);
      const currentCashflowData =
        queryClient.getQueryData<TransactionsResponse>(cashflowQueryKey);
      const currentTransactionExplorerData =
        queryClient.getQueryData<TransactionsResponse>(transactionExplorerQueryKey);
      const cashflowResult = applyTransactionEventToTransactions({
        currentData: currentCashflowData,
        from: cashflowWindowFrom,
        selectedUserId,
        streamEvent,
        to: cashflowWindowTo,
      });
      const transactionExplorerResult = applyTransactionEventToTransactions({
        currentData: currentTransactionExplorerData,
        from,
        selectedUserId,
        streamEvent,
        to,
      });

      if (cashflowResult.didChange && cashflowResult.data) {
        queryClient.setQueryData<TransactionsResponse>(cashflowQueryKey, cashflowResult.data);
        onCashflowAffected();
      }

      if (
        transactionExplorerResult.didChange &&
        transactionExplorerResult.data &&
        transactionExplorerResult.updateType
      ) {
        queryClient.setQueryData<TransactionsResponse>(
          transactionExplorerQueryKey,
          transactionExplorerResult.data,
        );
        onTransactionExplorerAffected(transactionExplorerResult.updateType);
      }

      if (
        eventDeduplicationKey &&
        (cashflowResult.didChange || transactionExplorerResult.didChange)
      ) {
        processedEventKeysRef.current.add(eventDeduplicationKey);
      }
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
