import { describe, expect, it } from 'vitest';
import type {
  Transaction,
  TransactionStreamEvent,
  TransactionsResponse,
} from '../api/transactions';
import {
  applyTransactionEventToTransactions,
  getTransactionStreamEventDeduplicationKey,
} from './transactionEventReducer';

const createTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  account_id: 'acc_1001_chk',
  amount: -47.8,
  currency: 'EUR',
  date: '2026-02-20',
  description: 'REWE MARKT EINKAUF',
  id: 'txn_001',
  merchant_category_code: '5411',
  merchant_name: 'REWE Markt',
  synced_at: '2026-02-20T10:00:00.000Z',
  type: 'debit',
  user_id: 'user_1001',
  ...overrides,
});

const createTransactionsResponse = (
  transactions: Transaction[],
): TransactionsResponse => ({
  has_more: false,
  limit: transactions.length,
  page: 1,
  total: transactions.length,
  transactions,
});

const createAddedEvent = (
  transaction: Transaction,
  id: string | null = '1',
): TransactionStreamEvent => ({
  data: {
    transaction,
    type: 'TRANSACTION_ADDED',
  },
  event: 'TRANSACTION_ADDED',
  id,
});

const createUpdatedEvent = (
  transaction: Transaction,
  id: string | null = '2',
): TransactionStreamEvent => ({
  data: {
    transaction,
    type: 'TRANSACTION_UPDATED',
  },
  event: 'TRANSACTION_UPDATED',
  id,
});

const createDeletedEvent = (
  transactionId: string,
  id: string | null = '3',
): TransactionStreamEvent => ({
  data: {
    transaction_id: transactionId,
    type: 'TRANSACTION_DELETED',
  },
  event: 'TRANSACTION_DELETED',
  id,
});

const applyEvent = (
  currentData: TransactionsResponse | undefined,
  streamEvent: TransactionStreamEvent,
) =>
  applyTransactionEventToTransactions({
    currentData,
    from: '2025-09-01',
    selectedUserId: 'user_1001',
    streamEvent,
    to: '2026-02-20',
  });

describe('getTransactionStreamEventDeduplicationKey', () => {
  it('uses SSE id when available', () => {
    expect(getTransactionStreamEventDeduplicationKey(createAddedEvent(createTransaction(), '7'))).toBe(
      'event:7',
    );
  });

  it('falls back to transaction identity when SSE id is missing', () => {
    const transaction = createTransaction({
      amount: -52.3,
      synced_at: '2026-02-20T11:00:00.000Z',
    });

    expect(getTransactionStreamEventDeduplicationKey(createUpdatedEvent(transaction, null))).toBe(
      'transaction:TRANSACTION_UPDATED:txn_001:2026-02-20T11:00:00.000Z:-52.3',
    );
  });
});

describe('applyTransactionEventToTransactions', () => {
  it('adds a new transaction without creating duplicates', () => {
    const transaction = createTransaction();
    const result = applyEvent(createTransactionsResponse([]), createAddedEvent(transaction));

    expect(result.didChange).toBe(true);
    expect(result.updateType).toBe('added');
    expect(result.data?.total).toBe(1);
    expect(result.data?.transactions).toEqual([transaction]);
  });

  it('ignores an added transaction when the same transaction already exists', () => {
    const transaction = createTransaction();
    const currentData = createTransactionsResponse([transaction]);
    const result = applyEvent(currentData, createAddedEvent(transaction));

    expect(result.didChange).toBe(false);
    expect(result.updateType).toBeNull();
    expect(result.data).toBe(currentData);
  });

  it('updates an existing transaction without changing total', () => {
    const transaction = createTransaction();
    const updatedTransaction = createTransaction({
      amount: -52.3,
      description: 'REWE MARKT EINKAUF (KORREKTUR)',
    });
    const result = applyEvent(
      createTransactionsResponse([transaction]),
      createUpdatedEvent(updatedTransaction),
    );

    expect(result.didChange).toBe(true);
    expect(result.updateType).toBe('updated');
    expect(result.data?.total).toBe(1);
    expect(result.data?.transactions).toEqual([updatedTransaction]);
  });

  it('upserts a missing updated transaction as an update', () => {
    const transaction = createTransaction();
    const result = applyEvent(createTransactionsResponse([]), createUpdatedEvent(transaction));

    expect(result.didChange).toBe(true);
    expect(result.updateType).toBe('updated');
    expect(result.data?.total).toBe(1);
    expect(result.data?.transactions).toEqual([transaction]);
  });

  it('deletes an existing transaction', () => {
    const transaction = createTransaction();
    const result = applyEvent(
      createTransactionsResponse([transaction]),
      createDeletedEvent(transaction.id),
    );

    expect(result.didChange).toBe(true);
    expect(result.updateType).toBe('deleted');
    expect(result.data?.total).toBe(0);
    expect(result.data?.transactions).toEqual([]);
  });

  it('ignores a delete event for a missing transaction', () => {
    const transaction = createTransaction();
    const currentData = createTransactionsResponse([transaction]);
    const result = applyEvent(currentData, createDeletedEvent('txn_missing'));

    expect(result.didChange).toBe(false);
    expect(result.updateType).toBeNull();
    expect(result.data).toBe(currentData);
  });

  it('ignores transaction events for another user', () => {
    const currentData = createTransactionsResponse([]);
    const result = applyEvent(
      currentData,
      createAddedEvent(createTransaction({ user_id: 'user_1002' })),
    );

    expect(result.didChange).toBe(false);
    expect(result.data).toBe(currentData);
  });

  it('ignores transaction events outside the date range', () => {
    const currentData = createTransactionsResponse([]);
    const result = applyEvent(
      currentData,
      createAddedEvent(createTransaction({ date: '2026-03-01' })),
    );

    expect(result.didChange).toBe(false);
    expect(result.data).toBe(currentData);
  });

  it('returns no change when cache data is not loaded', () => {
    const result = applyEvent(undefined, createAddedEvent(createTransaction()));

    expect(result.didChange).toBe(false);
    expect(result.updateType).toBeNull();
    expect(result.data).toBeUndefined();
  });
});
