import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DateField } from './components/DateField/DateField';
import { UserDashboard } from './components/UserDashboard/UserDashboard';
import { UsersList } from './components/UsersList/UsersList';
import { getApiDiscovery } from './shared/api/discovery';
import { QUERY_CACHE_TIME } from './shared/config/query';

export const App = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const {
    data: discovery,
    error: discoveryError,
    status: discoveryStatus,
  } = useQuery({
    queryKey: ['api-discovery'],
    queryFn: getApiDiscovery,
    staleTime: QUERY_CACHE_TIME.discoveryStaleTime,
  });

  const availableUsers = discovery?.available_users ?? [];
  const usersError =
    discoveryError instanceof Error ? discoveryError.message : 'Failed to load users';

  useEffect(() => {
    if (!discovery || dateRange.from || dateRange.to) {
      return;
    }

    setDateRange(discovery.data_range);
  }, [dateRange.from, dateRange.to, discovery]);

  return (
    <main className="app">
      <header className="app__header">
        <h1 className="app__title">Reliability Index Explorer</h1>

        <div className="app__date-range" aria-label="Date range">
          <DateField
            disabled={discoveryStatus === 'pending'}
            label="From"
            onChange={(from) => setDateRange((range) => ({ ...range, from }))}
            value={dateRange.from}
          />
          <DateField
            disabled={discoveryStatus === 'pending'}
            label="To"
            onChange={(to) => setDateRange((range) => ({ ...range, to }))}
            value={dateRange.to}
          />
        </div>
      </header>

      <div className="app__workspace">
        <UsersList
          availableUsers={availableUsers}
          onSelectUser={setSelectedUserId}
          queryStatus={discoveryStatus}
          selectedUserId={selectedUserId}
          usersError={usersError}
        />

        <UserDashboard from={dateRange.from} selectedUserId={selectedUserId} to={dateRange.to} />
      </div>
    </main>
  );
};
