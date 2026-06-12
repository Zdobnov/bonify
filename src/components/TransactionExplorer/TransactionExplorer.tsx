import { useCallback, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { getUserTransactions, type Transaction } from '../../shared/api/transactions';
import { getTransactionExplorerQueryKey } from '../../shared/queryKeys/transactions';
import './TransactionExplorer.css';

type SortKey = 'date' | 'merchant_name' | 'amount' | 'type';
type SortDirection = 'asc' | 'desc';
type AmountFilter = 'all' | 'positive' | 'negative';

const ALL_CATEGORY_FILTER = 'all';

type TransactionExplorerProps = {
  from: string;
  selectedUserId: string;
  to: string;
  updateSummary: TransactionExplorerUpdateSummary | null;
};

export type TransactionExplorerUpdateSummary = {
  added: number;
  deleted: number;
  key: number;
  updated: number;
};

const getUpdateSummaryText = (summary: TransactionExplorerUpdateSummary) => {
  const changedTransactionsCount = summary.added + summary.deleted + summary.updated;
  const parts = [
    summary.added > 0 ? `${summary.added} added` : null,
    summary.deleted > 0 ? `${summary.deleted} deleted` : null,
    summary.updated > 0 ? `${summary.updated} updated` : null,
  ].filter(Boolean);

  return `${parts.join(', ')} transaction${changedTransactionsCount === 1 ? '' : 's'}`;
};

const formatAmount = (transaction: Transaction) => {
  return new Intl.NumberFormat('en-US', {
    currency: transaction.currency,
    style: 'currency',
  }).format(transaction.amount);
};

const getSortIndicator = (columnKey: SortKey, sortKey: SortKey, sortDirection: SortDirection) => {
  if (columnKey !== sortKey) {
    return null;
  }

  return sortDirection;
};

export const TransactionExplorer = ({
  from,
  selectedUserId,
  to,
  updateSummary,
}: TransactionExplorerProps) => {
  const [hasRequestedTransactions, setHasRequestedTransactions] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [amountFilter, setAmountFilter] = useState<AmountFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORY_FILTER);
  const [merchantSearch, setMerchantSearch] = useState('');
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const transactionsQuery = useQuery({
    queryKey: getTransactionExplorerQueryKey(selectedUserId, from, to),
    queryFn: () =>
      getUserTransactions({
        from,
        to,
        userId: selectedUserId,
      }),
    enabled: Boolean(hasRequestedTransactions && selectedUserId && from && to),
  });

  const transactions = transactionsQuery.data?.transactions ?? [];
  const availableCategories = useMemo(() => {
    return Array.from(
      new Set(
        transactions
          .map((transaction) => transaction.merchant_category_code)
          .filter(Boolean),
      ),
    ).sort((firstCategory, secondCategory) => firstCategory.localeCompare(secondCategory));
  }, [transactions]);
  const filteredTransactions = useMemo(() => {
    const normalizedMerchantSearch = merchantSearch.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesAmount =
        amountFilter === 'all' ||
        (amountFilter === 'positive' && transaction.amount >= 0) ||
        (amountFilter === 'negative' && transaction.amount < 0);
      const matchesCategory =
        categoryFilter === ALL_CATEGORY_FILTER ||
        transaction.merchant_category_code === categoryFilter;
      const matchesMerchant =
        !normalizedMerchantSearch ||
        transaction.merchant_name.toLowerCase().includes(normalizedMerchantSearch);

      return matchesAmount && matchesCategory && matchesMerchant;
    });
  }, [amountFilter, categoryFilter, merchantSearch, transactions]);
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((firstTransaction, secondTransaction) => {
      const firstValue = firstTransaction[sortKey];
      const secondValue = secondTransaction[sortKey];

      if (typeof firstValue === 'number' && typeof secondValue === 'number') {
        return sortDirection === 'asc' ? firstValue - secondValue : secondValue - firstValue;
      }

      return sortDirection === 'asc'
        ? String(firstValue).localeCompare(String(secondValue))
        : String(secondValue).localeCompare(String(firstValue));
    });
  }, [filteredTransactions, sortDirection, sortKey]);
  const rowVirtualizer = useVirtualizer({
    count: sortedTransactions.length,
    estimateSize: () => 42,
    getScrollElement: () => tableContainerRef.current,
    overscan: 10,
  });

  const handleSort = useCallback((nextSortKey: SortKey) => {
    if (sortKey === nextSortKey) {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection(nextSortKey === 'date' ? 'desc' : 'asc');
  }, [sortKey]);

  if (!hasRequestedTransactions) {
    return (
      <button
        className="transaction-explorer__load-button"
        onClick={() => setHasRequestedTransactions(true)}
        type="button"
      >
        Load transactions
      </button>
    );
  }

  if (transactionsQuery.status === 'pending') {
    return <p className="transaction-explorer__status">Loading...</p>;
  }

  if (transactionsQuery.status === 'error') {
    return (
      <p className="transaction-explorer__status transaction-explorer__status--error">
        Failed to load transactions.
      </p>
    );
  }

  return (
    <div className="transaction-explorer">
      <div className="transaction-explorer__toolbar">
        <div className="transaction-explorer__summary">
          <span>Total: {transactionsQuery.data.total}</span>
          <span>Showing: {sortedTransactions.length}</span>
        </div>
      </div>
      <div className="transaction-explorer__filters">
        <fieldset className="transaction-explorer__filter-group">
          Amount:{' '}
          {(['all', 'negative', 'positive'] as AmountFilter[]).map((filterValue) => (
            <label className="transaction-explorer__checkbox" key={filterValue}>
              <input
                checked={amountFilter === filterValue}
                onChange={() => setAmountFilter(filterValue)}
                type="checkbox"
                name={`amount-filter-${filterValue.toLowerCase()}`}
              />
              <span
                className={
                  filterValue === 'positive'
                    ? 'transaction-explorer__filter-label transaction-explorer__filter-label--positive'
                    : filterValue === 'negative'
                      ? 'transaction-explorer__filter-label transaction-explorer__filter-label--negative'
                      : 'transaction-explorer__filter-label'
                }
              >
                {filterValue}
              </span>
            </label>
          ))}
        </fieldset>
        <label className="transaction-explorer__category">
          <span>Category</span>
          <select
            name="category-filter"
            onChange={(event) => setCategoryFilter(event.target.value)}
            value={categoryFilter}
          >
            <option value={ALL_CATEGORY_FILTER}>All</option>
            {availableCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        {updateSummary && (
          <div
            className="transaction-explorer__update-summary"
            key={updateSummary.key}
            role="status"
          >
            {getUpdateSummaryText(updateSummary)}
          </div>
        )}
        <label className="transaction-explorer__search">
          <input
            name="merchant-search"
            onChange={(event) => setMerchantSearch(event.target.value)}
            placeholder="Search merchant"
            type="search"
            value={merchantSearch}
          />
        </label>
      </div>
      <div className="transaction-explorer__table-wrap" ref={tableContainerRef}>
        <table className="transaction-explorer__table">
          <thead>
            <tr>
              <th>
                <button type="button" onClick={() => handleSort('date')}>
                  Date <span>{getSortIndicator('date', sortKey, sortDirection)}</span>
                </button>
              </th>
              <th>
                <button type="button" onClick={() => handleSort('merchant_name')}>
                  Merchant{' '}
                  <span>
                    {getSortIndicator('merchant_name', sortKey, sortDirection)}
                  </span>
                </button>
              </th>
              <th>Category</th>
              <th>
                <button type="button" onClick={() => handleSort('type')}>
                  Type <span>{getSortIndicator('type', sortKey, sortDirection)}</span>
                </button>
              </th>
              <th>
                <button type="button" onClick={() => handleSort('amount')}>
                  Amount{' '}
                  <span>{getSortIndicator('amount', sortKey, sortDirection)}</span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody
            className="transaction-explorer__table-body"
            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const transaction = sortedTransactions[virtualRow.index];

              return (
                <tr
                  className="transaction-explorer__table-row"
                  key={transaction.id}
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                >
                  <td>{transaction.date}</td>
                  <td>{transaction.merchant_name}</td>
                  <td>{transaction.merchant_category_code}</td>
                  <td>{transaction.type}</td>
                  <td
                    className={
                      transaction.amount >= 0
                        ? 'transaction-explorer__amount transaction-explorer__amount--positive'
                        : 'transaction-explorer__amount transaction-explorer__amount--negative'
                    }
                  >
                    {formatAmount(transaction)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {sortedTransactions.length === 0 && (
        <p className="transaction-explorer__status">No transactions found.</p>
      )}
    </div>
  );
};
