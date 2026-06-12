import { describe, expect, it } from 'vitest';
import type { Transaction } from '../api/transactions';
import { buildMonthlyCashflowData } from './cashflow';

const createTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  account_id: 'acc_1001_chk',
  amount: 100,
  currency: 'EUR',
  date: '2026-02-20',
  description: 'Transaction',
  id: 'txn_001',
  merchant_category_code: '5411',
  merchant_name: 'Merchant',
  synced_at: '2026-02-20T10:00:00.000Z',
  type: 'credit',
  user_id: 'user_1001',
  ...overrides,
});

describe('buildMonthlyCashflowData', () => {
  it('aggregates transactions in one monthly balance point per month', () => {
    const transactions = [
      createTransaction({ amount: 200, date: '2026-01-10', id: 'txn_001' }),
      createTransaction({ amount: -75.25, date: '2026-01-20', id: 'txn_002', type: 'debit' }),
      createTransaction({ amount: 50, date: '2026-02-01', id: 'txn_003' }),
    ];

    expect(buildMonthlyCashflowData(transactions, '2026-01-01', '2026-02-20')).toEqual([
      { balance: 124.75, month: 'Jan 2026' },
      { balance: 50, month: 'Feb 2026' },
    ]);
  });

  it('keeps missing months as zero-balance points', () => {
    const transactions = [
      createTransaction({ amount: 100, date: '2026-01-10', id: 'txn_001' }),
      createTransaction({ amount: -25, date: '2026-03-10', id: 'txn_002', type: 'debit' }),
    ];

    expect(buildMonthlyCashflowData(transactions, '2026-01-01', '2026-03-20')).toEqual([
      { balance: 100, month: 'Jan 2026' },
      { balance: 0, month: 'Feb 2026' },
      { balance: -25, month: 'Mar 2026' },
    ]);
  });

  it('rounds monthly balances to two decimals', () => {
    const transactions = [
      createTransaction({ amount: 10.005, date: '2026-01-10', id: 'txn_001' }),
      createTransaction({ amount: 0.005, date: '2026-01-11', id: 'txn_002' }),
    ];

    expect(buildMonthlyCashflowData(transactions, '2026-01-01', '2026-01-20')).toEqual([
      { balance: 10.01, month: 'Jan 2026' },
    ]);
  });

  it('skips transactions with invalid dates', () => {
    const transactions = [
      createTransaction({ amount: 100, date: '2026-01-10', id: 'txn_001' }),
      createTransaction({ amount: 999, date: 'not-a-date', id: 'txn_002' }),
    ];

    expect(buildMonthlyCashflowData(transactions, '2026-01-01', '2026-01-20')).toEqual([
      { balance: 100, month: 'Jan 2026' },
    ]);
  });
});
