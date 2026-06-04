import './UserItem.css';

type UserItemProps = {
  isSelected: boolean;
  onSelect: () => void;
  userId: string;
};

export const UserItem = ({ isSelected, onSelect, userId }: UserItemProps) => (
  <button
    className={isSelected ? 'users__button users__button--active' : 'users__button'}
    onClick={onSelect}
    type="button"
  >
    {userId}
  </button>
);
