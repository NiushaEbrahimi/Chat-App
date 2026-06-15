import { useDispatch, useSelector } from 'react-redux';
import { Bookmark, PlusCircle, X, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { setActiveRoom } from '../../store/slices/chatSlice';
import { setNewConvo, offNewConvo } from '../../store/slices/newConvo';
import type { RootState } from '../../store';
import type { Room } from '../../types/chatTypes';
import { fetchSavedMessage } from '../../api/chat';
import RoomAvatar from './components/RoomAvatar';

const ConversationList = () => {
  const dispatch = useDispatch();
  const rooms = useSelector((s: RootState) => s.chat.rooms);
  const activeRoomId = useSelector((s: RootState) => s.chat.activeRoomId);
  const onlineUserIds = useSelector((s: RootState) => s.chat.onlineUserIds);
  const currentUserId = useSelector((s: RootState) => s.auth.user?.id);
  const newConvo = useSelector((s: RootState) => s.newConvo.isNewConvo);

  const { data: savedRoom } = useQuery({
    queryKey: ['saved-messages-room'],
    queryFn: () => fetchSavedMessage(),
  })

  return (
    <div className='flex flex-col h-full'>
      {/* TODO: this should go to menu */}
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
        {/* TODO: this should go to menu */}
        <div 
          onClick={()=>{dispatch(setNewConvo())}} 
          className='w-full flex justify-center mt-5 gap-2 cursor-pointer'
        >
          <PlusCircle/> Add
        </div>
      </div>
      {newConvo && <AddNewConverstaion/>}
    </div>
  );
};

function AddNewConverstaion(){
  const dispatch = useDispatch()
  return(
    <main 
      className='w-screen h-screen z-1000 absolute top-0 left-0 flex justify-center items-center' 
      style={{backgroundColor : "rgba(255,255,255,0.7)"}}
    >
      <section className='w-1/2 h-2/3 bg-white border rounded-2xl shadow-2xl p-8 relative flex justify-center'>
        <div 
          className='absolute top-5 right-5 cursor-pointer rounded-2xl p-1 hover:border '
          onClick={()=>{dispatch(offNewConvo())}}
        >
          <X/>
        </div>
        <div className='relative w-1/2'>
          <input type="text" className='w-full border rounded-2xl p-2' placeholder='@...'/>
          <Search className='absolute top-2 right-2'/>
        </div>
      </section>
    </main>
  )
}

export default ConversationList;