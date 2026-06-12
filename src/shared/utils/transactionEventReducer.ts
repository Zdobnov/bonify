import type {
  Transaction,
  TransactionStreamEvent,
  TransactionsResponse,
} from '../api/transactions';
import { isDateWithinRange } from './date';

export type TransactionEventUpdateType = 'added' | 'deleted' | 'updated';

type ApplyTransactionEventParams = {
  currentData: TransactionsResponse | undefined;
  from: string;
  selectedUserId: string;
  streamEvent: TransactionStreamEvent;
  to: string;
};

type ApplyTransactionEventResult = {
  data: TransactionsResponse | undefined;
  didChange: boolean;
  updateType: TransactionEventUpdateType | null;
};

const areTransactionsEqual = (firstTransaction: Transaction, secondTransaction: Transaction) => {
  return (
    firstTransaction.id === secondTransaction.id &&
    firstTransaction.account_id === secondTransaction.account_id &&
    firstTransaction.amount === secondTransaction.amount &&
    firstTransaction.currency === secondTransaction.currency &&
    firstTransaction.date === secondTransaction.date &&
    firstTransaction.description === secondTransaction.description &&
    firstTransaction.merchant_category_code === secondTransaction.merchant_category_code &&
    firstTransaction.merchant_name === secondTransaction.merchant_name &&
    firstTransaction.type === secondTransaction.type &&
    firstTransaction.user_id === secondTransaction.user_id &&
    firstTransaction.synced_at === secondTransaction.synced_at
  );
};

export const getTransactionStreamEventDeduplicationKey = (
  streamEvent: TransactionStreamEvent,
) => {
  if (streamEvent.id) {
    return `event:${streamEvent.id}`;
  }

  const event = streamEvent.data;

  if (event.transaction) {
    return [
      'transaction',
      event.type,
      event.transaction.id,
      event.transaction.synced_at,
      event.transaction.amount,
    ].join(':');
  }

  if (event.transaction_id) {
    return ['transaction', event.type, event.transaction_id].join(':');
  }

  return null;
};

export const applyTransactionEventToTransactions = ({
  currentData,
  from,
  selectedUserId,
  streamEvent,
  to,
}: ApplyTransactionEventParams): ApplyTransactionEventResult => {
  if (!currentData) {
    return {
      data: currentData,
      didChange: false,
      updateType: null,
    };
  }

  const event = streamEvent.data;

  if (event.type === 'TRANSACTION_DELETED') {
    if (!event.transaction_id) {
      return {
        data: currentData,
        didChange: false,
        updateType: null,
      };
    }

    const transactionExists = currentData.transactions.some(
      (transaction) => transaction.id === event.transaction_id,
    );

    if (!transactionExists) {
      return {
        data: currentData,
        didChange: false,
        updateType: null,
      };
    }

    return {
      data: {
        ...currentData,
        total: Math.max(0, currentData.total - 1),
        transactions: currentData.transactions.filter(
          (transaction) => transaction.id !== event.transaction_id,
        ),
      },
      didChange: true,
      updateType: 'deleted',
    };
  }

  if (!event.transaction) {
    return {
      data: currentData,
      didChange: false,
      updateType: null,
    };
  }

  const eventTransaction = event.transaction;

  if (
    eventTransaction.user_id !== selectedUserId ||
    !isDateWithinRange(eventTransaction.date, from, to)
  ) {
    return {
      data: currentData,
      didChange: false,
      updateType: null,
    };
  }

  const existingTransactionIndex = currentData.transactions.findIndex(
    (transaction) => transaction.id === eventTransaction.id,
  );
  const existingTransaction =
    existingTransactionIndex >= 0 ? currentData.transactions[existingTransactionIndex] : null;

  if (existingTransaction && areTransactionsEqual(existingTransaction, eventTransaction)) {
    return {
      data: currentData,
      didChange: false,
      updateType: null,
    };
  }

  if (existingTransactionIndex >= 0) {
    return {
      data: {
        ...currentData,
        transactions: currentData.transactions.map((transaction) =>
          transaction.id === eventTransaction.id ? eventTransaction : transaction,
        ),
      },
      didChange: true,
      updateType: 'updated',
    };
  }

  return {
    data: {
      ...currentData,
      total: currentData.total + 1,
      transactions: [...currentData.transactions, eventTransaction],
    },
    didChange: true,
    updateType: event.type === 'TRANSACTION_ADDED' ? 'added' : 'updated',
  };
};
