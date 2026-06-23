// src/features/chat/ChatPage.tsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { fetchRooms } from '../../api/chat';
import { setRooms } from '../../store/slices/chatSlice';
import { useWebSocket } from '../../hooks/useWebSocket';
import ConversationList from './ConversionList';
import MessageThread from './MessageThread';
import type { RootState } from '../../store';

const ChatPage = () => {
  const dispatch = useDispatch();
  const activeRoomId = useSelector((s: RootState) => s.chat.activeRoomId);

  // initialise WebSocket for the whole session
  // hook lives here so it's always connected while on chat page
  useWebSocket();

  const { data } = useQuery({
    queryKey: ['rooms'],
    queryFn: fetchRooms,
  });

  useEffect(() => {
    if (data?.data) {
      dispatch(setRooms(data.data));
    }
  }, [data, dispatch]);

  return (
    <div className='flex h-screen overflow-hidden px-10 py-6 gap-6 bg-[var(--primary-faded)]'>
      <div className='flex-shrink-0 w-80 rounded-[28px] border border-[var(--border)] bg-white/95 shadow-[0_18px_80px_-48px_rgba(106,17,203,0.35)]'>
        <ConversationList />
      </div>
      <div className='flex-1 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_18px_80px_-48px_rgba(106,17,203,0.2)]'>
        {activeRoomId ? (
          <MessageThread roomId={activeRoomId} />
        ) : (
          <div className='flex h-full items-center justify-center text-slate-500'>
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;