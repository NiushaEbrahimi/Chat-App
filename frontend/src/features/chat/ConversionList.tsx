import { useDispatch, useSelector } from 'react-redux';
import { Bookmark, PlusCircle, Search, Menu, Cog, UserRoundPlus, EllipsisVertical, Sun, Moon, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useUserSearch } from '../../hooks/useUserSearch';

import { setActiveRoom, setRooms, toggleTheme } from '../../store/slices/chatSlice';
import { setNewConvo, offNewConvo } from '../../store/slices/newConvo';
import { openSettings, openProfile, closePanel } from '../../store/slices/uiSlice';
import type { RootState } from '../../store';

import type { Room, ChatUser } from '../../types/chatTypes';
import { fetchSavedMessage, createRoom } from '../../api/chat';
import useClickOutside from '../../hooks/useOutside';

import RoomAvatar from './components/RoomAvatar';
import Spinner from '../../shared/Spinner';
import UserAvatar from '../../shared/UserAvatar';
import { resolveAvatarUrl } from '../../utils/resolveAvatarUrl';

const MenuList = ( {setMenuDisplay} :{setMenuDisplay : React.Dispatch<React.SetStateAction<boolean>>} ) => {
  const [moreDisplay,setMoreDisplay] = useState(false);

  const dispatch = useDispatch();
  const { data: savedRoom } = useQuery({
    queryKey: ['saved-messages-room'],
    queryFn: () => fetchSavedMessage(),
  })

  const avatar = useSelector((s:RootState)=>s.auth.user?.avatar)
  const username = useSelector((s:RootState)=>s.auth.user?.username)
  const navigatge = useNavigate();

  return(
    <div 
      className={`w-56 z-10 bg-white rounded-4xl p-3 shadow-lg`}
    >
      <div className='relative flex flex-col gap-2'>

        <button
        // TODO
          onClick={() => {dispatch(openProfile()); setMenuDisplay(false)}}
          className='w-full inline-flex items-center gap-2 rounded-full border border-(--border) bg-white/90 px-4 py-2 text-sm font-medium text-(--primary) transition hover:bg-(--primary-faded)'
        >
          <UserAvatar avatar={resolveAvatarUrl(avatar)} username={username} inputSize={30}/>
          <p className='text-gray-600'>{username}</p>
        </button>

        <button
          onClick={() => navigatge("/auth/login")}
          className='w-full inline-flex items-center gap-2 rounded-full border border-(--border) bg-white/90 px-4 py-2 text-sm font-medium text-(--primary) transition hover:bg-(--primary-faded)'
        >
          <UserRoundPlus className='h-4 w-4'/>
          <p className='text-gray-600'>add User</p>
        </button>

        <div className='h-px bg-(--border)' />

        <button
          onClick={() => {
              if(savedRoom){
                dispatch(closePanel());
                dispatch(setActiveRoom({ roomId: savedRoom.data.id, roomType: 'saved_message', meta: savedRoom.data }))
              }
              setMenuDisplay(false)
            }
          }
          className='w-full inline-flex items-center gap-2 rounded-full border border-(--border) bg-white/90 px-4 py-2 text-sm font-medium text-(--primary) transition hover:bg-(--primary-faded)'
        >
          <Bookmark className='h-4 w-4' />
          <p className='text-gray-600'>Saved Messages</p>
        </button>

        <button
          type='button'
          onClick={() => {dispatch(setNewConvo()); setMenuDisplay(false);}}
          className='w-full inline-flex items-center gap-2 rounded-full border border-(--border) bg-white/90 px-4 py-2 text-sm font-medium text-(--primary) transition hover:bg-(--primary-faded)'
        >
          <PlusCircle className='h-4 w-4' />
          <p className='text-gray-600'>New Conversation</p>
        </button>

        <div className='h-px bg-(--border)' />

        <button
          type='button'
          className='w-full inline-flex items-center gap-2 rounded-full border border-(--border) bg-white/90 px-4 py-2 text-sm font-medium text-(--primary) transition hover:bg-(--primary-faded)'
          onClick={() => {dispatch(openSettings()); setMenuDisplay(false)}}
        >
          <Cog className='h-4 w-4' />
          <p className='text-gray-600'>Settings</p>
        </button>
        
        <div
          className="relative"
          onMouseEnter={() => setMoreDisplay(true)}
          onMouseLeave={() => setMoreDisplay(false)}
        >
          <button
            type='button'
            className='w-full inline-flex items-center gap-2 rounded-full border border-(--border) bg-white/90 px-4 py-2 text-sm font-medium text-(--primary) transition hover:bg-(--primary-faded)'
          >
            <EllipsisVertical className='h-4 w-4'/> 
            <p className='text-gray-600'>More</p>
          </button>
          {moreDisplay && <MoreList/>}
        </div>
      </div>
    </div>
  )
}

const MoreList = () => {

  const theme = useSelector((s:RootState)=> s.chat.theme)
  const dispatch = useDispatch();

  return(
    <div 
      className='absolute top-5 left-45 w-56 z-10 bg-white rounded-4xl p-2 shadow-lg '
    >
      <div className='relative flex flex-col gap-2'>
        <button
          onClick={() => {dispatch(toggleTheme())}}
          className='w-full inline-flex items-center gap-2 rounded-full border border-(--border) bg-white/90 px-4 py-2 text-sm font-medium text-(--primary) transition hover:bg-(--primary-faded)'
        >
          {theme==="light" 
          ? <div className='flex items-center gap-2'><Sun/> Light Theme </div>
          : <div className='flex items-center gap-2'><Moon/> Dark Theme</div>
          }
        </button>
      </div>
    </div>
  )
}

const ConversationList = () => {
  const dispatch = useDispatch();

  const [ menuDisplay, setMenuDisplay ] = useState(false);

  const rooms = useSelector((s: RootState) => s.chat.rooms);
  const activeRoom = useSelector((s: RootState) => s.chat.activeRoom);
  const onlineUserIds = useSelector((s: RootState) => s.chat.onlineUserIds);
  const currentUserId = useSelector((s: RootState) => s.auth.user?.id);
  const newConvo = useSelector((s: RootState) => s.newConvo.isNewConvo);

  const wrapperRef = useRef<HTMLDivElement>(null);

  console.log("activeRoom", activeRoom)
  console.log("rooms", rooms)

  useClickOutside(wrapperRef, () => setMenuDisplay(false));

  return (
    <div className='flex h-full flex-col rounded-[28px] bg-(--surface)'>
      <div className='rounded-t-[28px] border-b border-(--border) bg-(--primary)/10 px-4 py-3 text-(--primary)'>
        <div 
          className='flex items-center gap-2 relative'
          ref={wrapperRef}
        >
          <button
            onClick={() => setMenuDisplay(prev => !prev)}
            className={`p-2 rounded-4xl cursor-pointer transition-all duration-300 ${
              menuDisplay ? "bg-(--primary-faded)" : ""
            }`}
          >
            <Menu />
          </button>

          <div
            className={`
              absolute top-10 left-8 z-10
              transition-all duration-300
              ${menuDisplay
                ? "opacity-100 visible translate-y-0"
                : "opacity-0 invisible -translate-y-2"}
            `}
          >
            <MenuList setMenuDisplay={setMenuDisplay} />
          </div>
          <h1 className='text-2xl font-semibold text-(--primary)'>Chats</h1>
        </div>
      </div>

      <div className='flex-1 overflow-y-auto px-2'>
        {rooms.map((room: Room) => {
          const isActive = room.id === activeRoom.roomId;
          const otherMember = room.members.find(m => m.id !== currentUserId);
          const displayName = room.is_saved_messages
            ? room.name
            : room.is_group
              ? room.name
              : otherMember?.username ?? 'Unknown';
          const hasOnlineMember = room.members.some(m => onlineUserIds.includes(m.id));
          const senderMessage = room.is_group ? `${room.last_message?.sender.username} : ` : room.is_saved_messages ? 'You : ' : <></>;

          return (
            <button
              key={room.id}
              type='button'
              onClick={() => {
                const roomType = room.is_group ? 'group' : room.is_saved_messages ? 'saved_message' : 'user';
                const meta = room.is_group || room.is_saved_messages
                  ? room
                  : otherMember
                    ? { 
                        id: otherMember.id, 
                        username: otherMember.username, 
                        avatar: otherMember.avatar, 
                        is_online: onlineUserIds.includes(otherMember.id) 
                      }
                    : null;
                dispatch(closePanel());
                dispatch(setActiveRoom({ roomId: room.id, roomType, meta }));
              }}
              className={`w-full rounded-[22px] px-4 py-3 text-left transition mt-2 ${isActive ? 'bg-(--primary)/10 shadow-sm' : 'hover:bg-white/80'}`}
            >
              <div className='flex items-center gap-3'>
                <div className='relative'>
                  <RoomAvatar room={room} currentUserId={currentUserId} />
                  {hasOnlineMember && <span className='absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white' />}
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='text-sm font-medium text-slate-900'>{displayName}</div>
                  {room.last_message && (
                    <p className='truncate text-xs text-slate-500'>
                      {senderMessage} {room.last_message.content}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {newConvo && <AddNewConverstaion />}
    </div>
  );
};

type User = {
  avatar : null | string
  id : string
  is_online : boolean
  username : string
}

function AddNewConverstaion(){
  const dispatch = useDispatch()

  const [query, setQuery] = useState('')
  const { data, isLoading } = useUserSearch(query)
  const queryClient = useQueryClient();
  const rooms = useSelector((s: RootState) => s.chat.rooms);
  const onlineUserIds = useSelector((s: RootState) => s.chat.onlineUserIds);
  const currentUserId = useSelector((s: RootState) => s.auth.user?.id);

  const { mutate: startChat, isPending } = useMutation({
  mutationFn: ({userId , username } : {userId:string, username:string}) =>
    createRoom({ name: username, is_group: false, member_ids: [userId] }),

    onSuccess: (response) => {
      const room = response.data;
      // add to sidebar if it's a brand new room
      const exists = rooms.some(r => r.id === room.id);
      if (!exists) {
        dispatch(setRooms([room, ...rooms]));
      }

      // open the room — compute meta for header (other member)
      const other = room.members.find((m: ChatUser) => m.id !== currentUserId);
      const meta = other ? { id: other.id, username: other.username, avatar: other.avatar, is_online: onlineUserIds.includes(other.id) } : null;
      dispatch(closePanel());
      dispatch(setActiveRoom({ roomId: room.id, roomType: 'user', meta }));

      // refresh the rooms list in the background
      queryClient.invalidateQueries({ queryKey: ['rooms'] });

      dispatch(offNewConvo());
    },
  });

  return(
    <main className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-6'>
      <section className='w-full max-w-2xl min-h-100 rounded-4xl border border-(--border) bg-white/95 p-8 shadow-2xl'>
        <div className='w-full flex flex-col items-center gap-6'>
          <div 
            className='absolute right-8 top-8 rounded-full border border-(--border) bg-white p-2 text-slate-700 transition hover:bg-gray-300 cursor-pointer' 
            onClick={() => { dispatch(offNewConvo()) }}
          >
            <X/>
          </div>
          <div className='relative w-full max-w-md'>
            <input 
              value={query}
              onChange={e => setQuery(e.target.value)}
              type='text' 
              className='w-full rounded-3xl border border-(--border) bg-(--surface) px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400'
              placeholder='Search users by @username'
            />
            <Search className='absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-(--primary)' />
          </div>
          <div className='w-full flex-1 space-y-3 overflow-y-auto px-2'>
            {isLoading && <Spinner />}
            {data?.map((user: User, index: number) => (
              <div key={user.id}>
                <button
                  type='button'
                  className='flex w-full items-center gap-3 rounded-[22px] border border-(--border) bg-(--surface) px-4 py-3 text-left transition hover:border-(--primary) hover:bg-(--primary-faded)'
                  onClick={() => {
                    if (!isPending) startChat({ userId: user.id, username: user.username });
                  }}
                >
                  <UserAvatar avatar={resolveAvatarUrl(user.avatar)} inputSize={36} username={user.username} />
                  <div className='flex flex-col'>
                    <span className='text-sm font-medium text-slate-900'>{user.username}</span>
                    <span className='text-xs text-(--primary)'>
                      {user.is_online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  {isPending && (
                    <span className='ml-auto text-xs text-(--primary)'>Opening...</span>
                  )}
                </button>
                {index < data.length - 1 && (
                  <div className='h-px bg-(--border)' />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export default ConversationList;