import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { Search, X } from 'lucide-react';
import { useUserSearch } from '../../../hooks/useUserSearch';
import { updateRoom } from '../../../api/chat';
import UserSearchList from './UserSearchList';
import type { User } from './UserSearchList';
import type { RootState } from '../../../store';
import { setActiveRoom } from '../../../store/slices/chatSlice';

interface AddMemberModalProps {
  roomId: string;
  currentMemberIds: string[];
  onClose: () => void;
}

export default function AddMemberModal({ roomId, currentMemberIds, onClose }: AddMemberModalProps) {
  const [query, setQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const { data: users, isLoading } = useUserSearch(query);
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const activeRoom = useSelector((s: RootState) => s.chat.activeRoom);

  const addMemberMutation = useMutation({
    mutationFn: async () => {
      const memberIds = [...currentMemberIds, ...selectedUsers.map(u => u.id)];
      const formData = new FormData();
      memberIds.forEach(id => formData.append('member_ids', id));
      await updateRoom(roomId, formData);
    },
    onSuccess: () => {
      // Update activeRoom meta with new members
      if (activeRoom.roomId === roomId && activeRoom.meta) {
        const newMembers = [...(activeRoom.meta.members ?? []), ...selectedUsers.map(u => ({
          id: u.id,
          username: u.username,
          avatar: u.avatar,
          is_online: false,
        }))];
        dispatch(setActiveRoom({
          roomId,
          roomType: activeRoom.roomType,
          meta: { ...activeRoom.meta, members: newMembers },
        }));
      }
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      onClose();
    },
    onError: (error: any) => {
      console.error('Failed to add members:', error);
    },
  });

  const handleUserClick = (user: User) => {
    setSelectedUsers(prev => {
      const exists = prev.some(u => u.id === user.id);
      if (exists) {
        return prev.filter(u => u.id !== user.id);
      }
      return [...prev, user];
    });
  };

  const handleSubmit = () => {
    if (selectedUsers.length > 0) {
      addMemberMutation.mutate();
    }
  };

  return (
    <main className='fixed inset-0 z-150 flex items-center justify-center bg-slate-950/40 p-6'>
      <section className='w-full max-w-md max-h-[80vh] flex flex-col rounded-4xl border border-(--border) bg-white/95 p-6 shadow-2xl'>
        <div className='w-full flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-slate-900'>Add Members</h3>
          <div
            className='rounded-full border border-(--border) bg-white p-2 text-slate-700 transition hover:bg-gray-300 cursor-pointer'
            onClick={onClose}
          >
            <X size={16} />
          </div>
        </div>

        <div className='relative w-full mb-4'>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            type='text'
            className='w-full rounded-3xl border border-(--border) bg-(--surface) px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400'
            placeholder='Search users by @username'
          />
          <Search className='absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-(--primary)' />
        </div>

        <div className='flex-1 overflow-y-auto min-h-0'>
          <UserSearchList
            users={users ?? []}
            isLoading={isLoading}
            selectedUsers={selectedUsers}
            onUserClick={handleUserClick}
          />
        </div>

        {selectedUsers.length > 0 && (
          <div className='w-full flex flex-wrap gap-2 mt-4'>
            {selectedUsers.map(user => (
              <div
                key={user.id}
                className='rounded-full bg-(--primary-faded) px-3 py-1 text-sm'
              >
                @{user.username}
              </div>
            ))}
          </div>
        )}

        <button
          disabled={selectedUsers.length === 0 || addMemberMutation.isPending}
          onClick={handleSubmit}
          className='w-full mt-4 rounded-3xl bg-(--primary) px-4 py-2 text-sm font-medium text-white transition hover:bg-(--primary-faded-bg) disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {addMemberMutation.isPending ? 'Adding...' : 'Add Members'}
        </button>
      </section>
    </main>
  );
}
