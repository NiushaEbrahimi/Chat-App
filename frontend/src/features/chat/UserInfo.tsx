import { useMutation, useQueryClient } from '@tanstack/react-query';
import UserAvatar from '../../shared/UserAvatar';
import { useDispatch, useSelector } from 'react-redux';
import { resolveAvatarUrl } from '../../utils/resolveAvatarUrl';
import type { RootState } from '../../store';
import { ArrowLeft, MessageCircle, Trash2, Eraser } from 'lucide-react';
import { closePanel } from '../../store/slices/uiSlice';
import { deleteRoom, clearMessages } from '../../api/chat';
import { setActiveRoom, setMessages } from '../../store/slices/chatSlice';
import { useAuth } from '../../hooks/useAuth';
import type { ApiError } from '../../types/errorTypes';

export default function UserInfo() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const activeRoom = useSelector((s: RootState) => s.chat.activeRoom);
  const { user } = useAuth();

  const userAvatar = resolveAvatarUrl(activeRoom.meta?.avatar ?? undefined);
  const username = activeRoom.meta?.username ?? 'Unknown User';
  const isOnline = activeRoom.meta?.is_online ?? false;

  const deleteMutation = useMutation({
    mutationFn: () => deleteRoom(activeRoom.roomId!),
    onSuccess: () => {
      dispatch(setActiveRoom({ roomId: null, roomType: 'user' }));
      dispatch(closePanel());
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
    onError: (error: ApiError) => {
      console.error('Delete failed:', error);
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => clearMessages(activeRoom.roomId!),
    onSuccess: () => {
      dispatch(setMessages({ roomId: activeRoom.roomId!, messages: [] }));
      queryClient.invalidateQueries({ queryKey: ['messages', activeRoom.roomId] });
    },
    onError: (error: ApiError) => {
      console.error('Clear failed:', error);
    },
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  const handleClear = () => {
    if (window.confirm('Clear all messages in this chat? This cannot be undone.')) {
      clearMutation.mutate();
    }
  };

  return (
    <div className='w-full h-full flex flex-col rounded-[28px] bg-(--surface) p-8'>
      <div className='flex items-center mb-6 text-(--primary)'>
        <ArrowLeft className='mr-2 cursor-pointer' onClick={() => dispatch(closePanel())} />
        <h2 className='text-2xl font-semibold'>User Info</h2>
      </div>

      <div className='flex flex-col items-center gap-4 mb-8'>
        <UserAvatar avatar={userAvatar} inputSize={100} username={username} />
        <h3 className='text-xl font-semibold text-(--primary)'>{username}</h3>
        <div className='flex items-center gap-2'>
          <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className='text-sm text-gray-500'>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      <div className='flex-1 flex flex-col gap-4'>
        <div className='p-4 rounded-[14px] border border-(--primary-faded)'>
          <p className='text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1'>Username</p>
          <p className='text-gray-900 font-medium'>{username}</p>
        </div>
      </div>

      <div className='mt-6 pt-4 border-t border-(--border) flex flex-col gap-3'>
        <button className='w-full flex items-center justify-center gap-2 py-3 rounded-[14px] bg-(--primary) text-white font-semibold transition hover:bg-(--secondary) cursor-pointer'>
          <MessageCircle size={18} />
          Send Message
        </button>
        {user && activeRoom.meta?.id === user.id && (
          <button
            onClick={handleClear}
            disabled={clearMutation.isPending}
            className='w-full flex items-center justify-center gap-2 py-3 rounded-[14px] border border-orange-300 text-orange-500 font-semibold transition hover:bg-orange-50 cursor-pointer disabled:opacity-50'
          >
            <Eraser size={18} />
            {clearMutation.isPending ? 'Clearing...' : 'Clear Chat'}
          </button>
        )}
        <button
          onClick={handleDelete}
          className='w-full flex items-center justify-center gap-2 py-3 rounded-[14px] border border-red-300 text-red-500 font-semibold transition hover:bg-red-50 cursor-pointer'
        >
          <Trash2 size={18} />
          Delete Chat
        </button>
      </div>
    </div>
  );
}
