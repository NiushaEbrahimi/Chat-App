import { useDispatch, useSelector } from 'react-redux';
import { setActiveRoom } from '../../store/slices/chatSlice';
import type { RootState } from '../../store';
import type { Room } from '../../types/chatTypes';
import { Bookmark } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchSavedMessage } from '../../api/chat';
import RoomAvatar from './components/RoomAvatar';

const ConversationList = () => {
  const dispatch = useDispatch();
  const rooms = useSelector((s: RootState) => s.chat.rooms);
  const activeRoomId = useSelector((s: RootState) => s.chat.activeRoomId);
  const onlineUserIds = useSelector((s: RootState) => s.chat.onlineUserIds);
  const currentUserId = useSelector((s: RootState) => s.auth.user?.id);

  const { data: savedRoom } = useQuery({
    queryKey: ['saved-messages-room'],
    queryFn: () => fetchSavedMessage(),
  })

  return (
    <div className='flex flex-col h-full'>
      <div className='flex justify-between items-center p-4 border-b border-gray-400 shadow'>
        <h1 className='text-2xl font-semibold'>Chats</h1>
        <span className='flex cursor-pointer' onClick={()=>savedRoom && dispatch(setActiveRoom(savedRoom.data.id))}>
          <Bookmark/> saved
        </span>
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {rooms.map((room: Room) => {
          const isActive = room.id === activeRoomId;

          // for DMs, show the other person's name
          const displayName = room.is_saved_messages
          ? room.name
          :room.is_group
            ? room.name
            : room.members.find(m => m.id !== currentUserId)?.username ?? 'Unknown';

          // check if any member is online
          const hasOnlineMember = room.members.some(m => onlineUserIds.includes(m.id));

          return (
            <div
              key={room.id}
              onClick={() => dispatch(setActiveRoom(room.id))}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                background: isActive ? '#f0f0f0' : 'transparent',
                borderBottom: '1px solid #f5f5f5',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              
              <div className='relative'>
                <RoomAvatar room={room} currentUserId={currentUserId}/>
                {hasOnlineMember && <div className='w-2 h-2 rounded-4xl bg-green-500 absolute bottom-0 right-0'></div>}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{displayName}</div>
                {room.last_message && (
                  <div style={{
                    fontSize: 12, color: '#999',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {room.last_message.sender.username}: {room.last_message.content}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConversationList;