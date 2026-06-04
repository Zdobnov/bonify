import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getUserTransactions } from '../../shared/api/transactions';
import { getCashflowTransactionsQueryKey } from '../../shared/queryKeys/transactions';
import {
  getMonthKey,
  getMonthLabel,
  getMonthsInRange,
  subtractMonthsFromDate,
} from '../../shared/utils/date';
import './CashflowTimeline.css';

const CASHFLOW_WINDOW_MONTHS = 6;
const AMOUNT_FORMATTER = new Intl.NumberFormat('en-US', {
  currency: 'EUR',
  maximumFractionDigits: 0,
  style: 'currency',
});

type CashflowTimelineProps = {
  from: string;
  pulseKey: number;
  selectedUserId: string;
};

export const CashflowTimeline = ({ from, pulseKey, selectedUserId }: CashflowTimelineProps) => {
  const [isPulseActive, setIsPulseActive] = useState(false);
  const cashflowWindowFrom = from ? subtractMonthsFromDate(from, CASHFLOW_WINDOW_MONTHS) : '';
  const cashflowWindowTo = from;
  const transactionsQuery = useQuery({
    queryKey: getCashflowTransactionsQueryKey(
      selectedUserId,
      cashflowWindowFrom,
      cashflowWindowTo,
    ),
    queryFn: () =>
      getUserTransactions({
        from: cashflowWindowFrom,
        to: cashflowWindowTo,
        userId: selectedUserId,
    }),
    enabled: Boolean(selectedUserId && cashflowWindowFrom && cashflowWindowTo),
  });
  const chartData =
    transactionsQuery.data && cashflowWindowFrom && cashflowWindowTo
      ? getMonthsInRange(cashflowWindowFrom, cashflowWindowTo).map((monthKey) => {
          const balance = transactionsQuery.data.transactions
            .filter((transaction) => getMonthKey(transaction.date) === monthKey)
            .reduce((sum, transaction) => sum + transaction.amount, 0);

          return {
            balance: Number(balance.toFixed(2)),
            month: getMonthLabel(monthKey),
          };
        })
      : [];

  useEffect(() => {
    if (pulseKey === 0) {
      return;
    }

    setIsPulseActive(true);
    const timeoutId = window.setTimeout(() => {
      setIsPulseActive(false);
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pulseKey]);

  return (
    <article
      className={
        isPulseActive
          ? 'dashboard__card dashboard__card--wide cashflow-timeline cashflow-timeline--pulse'
          : 'dashboard__card dashboard__card--wide cashflow-timeline'
      }
    >
      <h2 className="dashboard__card-title">Cashflow Timeline</h2>
      {transactionsQuery.status === 'pending' && (
        <p className="dashboard__card-status">Loading...</p>
      )}
      {transactionsQuery.status === 'error' && (
        <p className="dashboard__card-status dashboard__card-status--error">
          Failed to load cashflow transactions.
        </p>
      )}
      {transactionsQuery.status === 'success' && (
        <div className="cashflow-timeline__content">
          <p className="cashflow-timeline__summary">
            Monthly balance from {cashflowWindowFrom} to {cashflowWindowTo}
          </p>
          <div className="cashflow-timeline__chart" aria-label="Monthly cashflow balance chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ bottom: 4, left: 8, right: 16, top: 12 }}>
                <CartesianGrid stroke="#eef0f2" vertical={false} />
                <XAxis dataKey="month" tickLine={false} />
                <YAxis
                  tickFormatter={(value) => AMOUNT_FORMATTER.format(Number(value))}
                  tickLine={false}
                  width={72}
                />
                <Tooltip
                  formatter={(value) => [AMOUNT_FORMATTER.format(Number(value)), 'Balance']}
                  labelStyle={{ color: '#202124' }}
                />
                <Line
                  dataKey="balance"
                  dot={{ r: 3 }}
                  name="Balance"
                  stroke="#174ea6"
                  strokeWidth={3}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </article>
  );
};
