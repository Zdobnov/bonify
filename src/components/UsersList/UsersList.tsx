import { UserItem } from '../UserItem/UserItem';
import './UsersList.css';

type UsersListProps = {
  availableUsers: string[];
  onSelectUser: (userId: string) => void;
  queryStatus: 'pending' | 'error' | 'success';
  selectedUserId: string | null;
  usersError: string | null;
};

export const UsersList = ({
  availableUsers,
  onSelectUser,
  queryStatus,
  selectedUserId,
  usersError,
}: UsersListProps) => (
  <aside className="users" aria-label="Users">
    <h2 className="users__title">Users</h2>

    {queryStatus === 'pending' && <p className="users__state">Loading users...</p>}
    {queryStatus === 'error' && <p className="users__state users__state--error">{usersError}</p>}
    {queryStatus === 'success' && availableUsers.length === 0 && (
      <p className="users__state">No users found</p>
    )}

    {queryStatus === 'success' && availableUsers.length > 0 && (
      <nav className="users__list">
        {availableUsers.map((userId) => (
          <UserItem
            isSelected={selectedUserId === userId}
            key={userId}
            onSelect={() => onSelectUser(userId)}
            userId={userId}
          />
        ))}
      </nav>
    )}
  </aside>
);
