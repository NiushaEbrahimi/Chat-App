import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import { useUserSearch } from '../../../hooks/useUserSearch';
import { updateRoom } from '../../../api/chat';
import UserSearchList from './UserSearchList';
import type { User } from './UserSearchList';

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

  const addMemberMutation = useMutation({
    mutationFn: async () => {
      const memberIds = [...currentMemberIds, ...selectedUsers.map(u => u.id)];
      const formData = new FormData();
      memberIds.forEach(id => formData.append('member_ids', id));
      await updateRoom(roomId, formData);
    },
    onSuccess: () => {
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
      <section className='w-full max-w-md min-h-80 rounded-4xl border border-(--border) bg-white/95 p-6 shadow-2xl'>
        <div className='w-full flex flex-col items-center gap-4'>
          <div className='w-full flex items-center justify-between'>
            <h3 className='text-lg font-semibold text-slate-900'>Add Members</h3>
            <div
              className='rounded-full border border-(--border) bg-white p-2 text-slate-700 transition hover:bg-gray-300 cursor-pointer'
              onClick={onClose}
            >
              <X size={16} />
            </div>
          </div>

          <div className='relative w-full'>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              type='text'
              className='w-full rounded-3xl border border-(--border) bg-(--surface) px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400'
              placeholder='Search users by @username'
            />
            <Search className='absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-(--primary)' />
          </div>

          <UserSearchList
            users={users ?? []}
            isLoading={isLoading}
            selectedUsers={selectedUsers}
            onUserClick={handleUserClick}
          />

          {selectedUsers.length > 0 && (
            <div className='w-full flex flex-wrap gap-2'>
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
            className='w-full rounded-3xl bg-(--primary) px-4 py-2 text-sm font-medium text-white transition hover:bg-(--primary-faded-bg) disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {addMemberMutation.isPending ? 'Adding...' : 'Add Members'}
          </button>
        </div>
      </section>
    </main>
  );
}
