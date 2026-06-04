import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CashflowTimeline } from '../CashflowTimeline/CashflowTimeline';
import { ReliabilityOverview } from '../ReliabilityOverview/ReliabilityOverview';
import { ScoreBreakdown } from '../ScoreBreakdown/ScoreBreakdown';
import {
  TransactionExplorer,
  type TransactionExplorerUpdateSummary,
} from '../TransactionExplorer/TransactionExplorer';
import { getUserReliability } from '../../shared/api/reliability';
import { QUERY_CACHE_TIME } from '../../shared/config/query';
import { useTransactionEventHandler } from '../../shared/hooks/useTransactionEventHandler';
import { useTransactionEvents } from '../../shared/hooks/useTransactionEvents';
import { subtractMonthsFromDate } from '../../shared/utils/date';
import './UserDashboard.css';

const CASHFLOW_WINDOW_MONTHS = 6;

type UserDashboardProps = {
  from: string;
  selectedUserId: string | null;
  to: string;
};

export const UserDashboard = ({ from, selectedUserId, to }: UserDashboardProps) => {
  const [cashflowPulseKey, setCashflowPulseKey] = useState(0);
  const [transactionExplorerUpdateSummary, setTransactionExplorerUpdateSummary] =
    useState<TransactionExplorerUpdateSummary | null>(null);
  const transactionExplorerSummaryTimeoutRef = useRef<number | null>(null);
  const cashflowWindowFrom = from ? subtractMonthsFromDate(from, CASHFLOW_WINDOW_MONTHS) : '';
  const cashflowWindowTo = from;
  const showTransactionExplorerUpdateSummary = useCallback(
    (type: 'added' | 'deleted' | 'updated') => {
      setTransactionExplorerUpdateSummary((currentSummary) => ({
        added: (currentSummary?.added ?? 0) + (type === 'added' ? 1 : 0),
        deleted: (currentSummary?.deleted ?? 0) + (type === 'deleted' ? 1 : 0),
        key: (currentSummary?.key ?? 0) + 1,
        updated: (currentSummary?.updated ?? 0) + (type === 'updated' ? 1 : 0),
      }));

      if (transactionExplorerSummaryTimeoutRef.current) {
        window.clearTimeout(transactionExplorerSummaryTimeoutRef.current);
      }

      transactionExplorerSummaryTimeoutRef.current = window.setTimeout(() => {
        setTransactionExplorerUpdateSummary(null);
      }, 3000);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (transactionExplorerSummaryTimeoutRef.current) {
        window.clearTimeout(transactionExplorerSummaryTimeoutRef.current);
      }
    };
  }, []);

  const handleCashflowAffected = useCallback(() => {
    setCashflowPulseKey((pulseKey) => pulseKey + 1);
  }, []);

  const handleTransactionEvent = useTransactionEventHandler({
    cashflowWindowFrom,
    cashflowWindowTo,
    from,
    onCashflowAffected: handleCashflowAffected,
    onTransactionExplorerAffected: showTransactionExplorerUpdateSummary,
    selectedUserId,
    to,
  });

  useTransactionEvents({
    onEvent: handleTransactionEvent,
    userId: selectedUserId,
  });

  const reliabilityQuery = useQuery({
    queryKey: ['user-reliability', selectedUserId, from],
    queryFn: () => getUserReliability({ from, userId: selectedUserId! }),
    enabled: Boolean(selectedUserId && from),
    staleTime: QUERY_CACHE_TIME.reliabilityStaleTime,
    gcTime: QUERY_CACHE_TIME.reliabilityGcTime,
  });
  const reliability = reliabilityQuery.data;
  const riskSignals = useMemo(
    () => reliability?.drivers.filter((driver) => /\(-\d+\spts\)/i.test(driver)) ?? [],
    [reliability?.drivers],
  );
  const positiveSignals = useMemo(
    () => reliability?.drivers.filter((driver) => /\(\+\d+\spts\)/i.test(driver)) ?? [],
    [reliability?.drivers],
  );
  const canLoadTransactions = Boolean(selectedUserId && from && to);

  return (
    <section className="dashboard" aria-live="polite">
      {selectedUserId ? (
        <>
          <header className="dashboard__header">
            <h2 className="dashboard__title">{selectedUserId}</h2>
          </header>

          <section className="dashboard__grid" aria-label="Dashboard sections">
            <ReliabilityOverview reliability={reliability} status={reliabilityQuery.status} />
            <ScoreBreakdown
              positiveSignals={positiveSignals}
              reliability={reliability}
              riskSignals={riskSignals}
              status={reliabilityQuery.status}
            />
            <CashflowTimeline
              from={from}
              pulseKey={cashflowPulseKey}
              selectedUserId={selectedUserId}
            />
            <article className="dashboard__card dashboard__card--wide">
              <h2 className="dashboard__card-title">Transaction Explorer</h2>
              {canLoadTransactions && (
                <TransactionExplorer
                  from={from}
                  selectedUserId={selectedUserId}
                  to={to}
                  updateSummary={transactionExplorerUpdateSummary}
                />
              )}
            </article>
          </section>
        </>
      ) : (
        <div className="dashboard__empty-state">Select user</div>
      )}
    </section>
  );
};
