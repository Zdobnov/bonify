import type { Transaction } from '../api/transactions';
import { getMonthKey, getMonthLabel, getMonthsInRange } from './date';

export type MonthlyCashflowPoint = {
  balance: number;
  month: string;
};

export const buildMonthlyCashflowData = (
  transactions: Transaction[],
  from: string,
  to: string,
): MonthlyCashflowPoint[] => {
  const balanceByMonth = new Map<string, number>();

  transactions.forEach((transaction) => {
    const monthKey = getMonthKey(transaction.date);

    if (!monthKey) {
      return;
    }

    balanceByMonth.set(monthKey, (balanceByMonth.get(monthKey) ?? 0) + transaction.amount);
  });

  return getMonthsInRange(from, to).map((monthKey) => {
    const balance = balanceByMonth.get(monthKey) ?? 0;

    return {
      balance: Number(balance.toFixed(2)),
      month: getMonthLabel(monthKey),
    };
  });
};
