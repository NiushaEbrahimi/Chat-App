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
    <div 
      className='flex h-screen overflow-hidden px-10 py-6 gap-6'
    >
      <div style={{ flexShrink: 0 }}
      className='rounded-2xl border border-gray-300 w-80 bg-white'
      >
        <ConversationList />
      </div>
      <div className='flex-1 rounded-2xl border border-gray-300 bg-white'>
        {activeRoomId
          ? <MessageThread roomId={activeRoomId} />
          : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
              Select a conversation
            </div>
        }
      </div>
    </div>
  );
};

export default ChatPage;