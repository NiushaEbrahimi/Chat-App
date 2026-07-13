import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { fetchRooms } from '../../api/chat';
import { setRooms } from '../../store/slices/chatSlice';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useThemeInitializer } from '../../hooks/useThemeInitializer';
import ConversationList from './ConversionList';
import MessageThread from './MessageThread';
import type { RootState } from '../../store';
import ProfileEdit from './ProfileEdit';
import Settings from './Settings';
import GroupInfo from './GroupInfo';
import UserInfo from './UserInfo';

const ChatPage = () => {
  const dispatch = useDispatch();
  const activeRoom = useSelector((s: RootState) => s.chat.activeRoom);
  const activePanel = useSelector((s: RootState) => s.ui.openPanel );

  // Initialize theme on mount and when it changes
  useThemeInitializer();

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
    <div className='flex h-screen overflow-hidden px-10 py-6 gap-6 bg-(--primary-faded)'>
      <div className='shrink-0 w-80 rounded-[28px] border border-(--border) bg-white/95 shadow-[0_18px_80px_-48px_rgba(106,17,203,0.35)]'>
        <ConversationList />
      </div>
      <div className='flex-1 rounded-[28px] border border-(--border) bg-(--surface) shadow-[0_18px_80px_-48px_rgba(106,17,203,0.2)]'>
        {activePanel === 'profile' ? (
          <div className='flex h-full items-center justify-center text-slate-500'>
            <ProfileEdit/>
          </div>
        ) : activePanel === 'settings' ? (
          <div className='flex h-full items-center justify-center text-slate-500'>
            <Settings/>
          </div>
        ) : activePanel === 'group-info' ? (
          <div className='flex h-full items-center justify-center text-slate-500'>
            <GroupInfo/>
          </div>
        ) : activePanel === 'saved-message-info' ? (
          <div className='flex h-full items-center justify-center text-slate-500'>
            <GroupInfo/>
          </div>
        ) : activePanel === 'user-info' ? (
          <div className='flex h-full items-center justify-center text-slate-500'>
            <UserInfo/>
          </div>
        ) :
        activeRoom.roomId ? (
          <MessageThread roomId={activeRoom.roomId} />
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