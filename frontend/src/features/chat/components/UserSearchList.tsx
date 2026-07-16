import { useSelector } from 'react-redux';
import UserAvatar from '../../../shared/UserAvatar';
import { resolveAvatarUrl } from '../../../utils/resolveAvatarUrl';
import type { RootState } from '../../../store';
import Spinner from '../../../shared/Spinner';

export type User = {
  avatar: null | string;
  id: string;
  is_online: boolean;
  username: string;
};

interface UserSearchListProps {
  users: User[];
  isLoading: boolean;
  selectedUsers?: User[];
  onUserClick: (user: User) => void;
  loadingUserId?: string;
}

export default function UserSearchList({ users, isLoading, selectedUsers = [], onUserClick, loadingUserId }: UserSearchListProps) {
  const onlineUserIds = useSelector((s: RootState) => s.chat.onlineUserIds);

  return (
    <div className='w-full space-y-3 overflow-y-auto px-2'>
      {isLoading && <Spinner />}
      {users.map((user) => (
        <button
          key={user.id}
          type='button'
          className={`flex w-full items-center gap-3 rounded-[22px] border px-4 py-3 text-left transition hover:border-(--primary) hover:bg-(--primary-faded)
          ${
            selectedUsers.some(u => u.id === user.id)
              ? 'border-(--primary) bg-(--primary-faded)'
              : 'border-(--border) bg-(--surface)'
          }`}
          onClick={() => onUserClick(user)}
        >
          <UserAvatar avatar={resolveAvatarUrl(user.avatar)} inputSize={36} username={user.username} />
          <div className='flex flex-col'>
            <span className='text-sm font-medium text-slate-900'>{user.username}</span>
            <span className='text-xs text-(--primary)'>
              {onlineUserIds.includes(user.id) ? 'Online' : 'Offline'}
            </span>
          </div>
          {loadingUserId === user.id && (
            <span className='ml-auto text-xs text-(--primary)'>Adding...</span>
          )}
        </button>
      ))}
    </div>
  );
}
