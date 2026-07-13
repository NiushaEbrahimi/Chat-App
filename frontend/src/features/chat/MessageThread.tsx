import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useInfiniteQuery, type QueryFunctionContext, type InfiniteData } from '@tanstack/react-query';
import GlassCard from '../../shared/GlassCard';

import { fetchMessages } from '../../api/chat';
import { setMessages } from '../../store/slices/chatSlice';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useTextSize } from '../../hooks/useTextSize';
import MessageInput from './components/MessageInput';
import type { Message } from '../../types/chatTypes';
import type { RootState } from '../../store';
import UserAvatar from '../../shared/UserAvatar';
import { openGroupInfo, openUserInfo } from '../../store/slices/uiSlice';

interface Props {
  roomId: string;
}

const formatMessageTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return `${time}`;
};

const formatDayLabel = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const today = new Date();
  if (date.toDateString() === today.toDateString()) return 'Today';

  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const MessageThread = ({ roomId }: Props) => {
  const dispatch = useDispatch();
  const { sendMessage } = useWebSocket();
  const { className: textSizeClass } = useTextSize();
  const messages = useSelector((s: RootState) => s.chat.messages[roomId] ?? []) as Message[];
  const activeRoom = useSelector((s: RootState) => s.chat.activeRoom);
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<
    { data: { results: Message[]; next: string | null } },
    Error,
    { data: { results: Message[]; next: string | null } },
    [string, string]
  >({
    queryKey: ['messages', roomId],
    queryFn: (context: QueryFunctionContext) => fetchMessages(roomId, context.pageParam as string | undefined),
    getNextPageParam: (lastPage) => lastPage.data.next ?? undefined,
    initialPageParam: undefined,
  });

  const typedData = data as InfiniteData<{ data: { results: Message[]; next: string | null } }> | undefined;

  // flatten all pages into Redux
  useEffect(() => {
    if (typedData) {
      const allMessages = typedData.pages.flatMap(p => p.data.results).reverse();
      dispatch(setMessages({ roomId, messages: allMessages }));
    }
  }, [typedData, roomId, dispatch]);

  // scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // mark messages as read using IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const messageId = (entry.target as HTMLElement).dataset.messageId;
          if (messageId) {
            sendMessage({ type: 'message_read', message_id: messageId });
          }
        }
      });
    }, { threshold: 1.0 });

    document.querySelectorAll('[data-message-id]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [messages, sendMessage]);

  const isTyping = useSelector((s: RootState) => s.chat.typingUsers[roomId] ?? []);
  return (
    <div className='flex h-full flex-col rounded-[28px] border border-(--border) bg-(--secondary-faded) shadow-inner shadow-[rgba(106,17,203,0.08)]'>

          <div className={`sticky h-0 top-12 z-10 rounded-[28px] flex justify-center items-center px-10`}>
            <div 
              className='flex-1 flex justify-center'
              onClick={()=>{
                if(activeRoom.roomType==="group")dispatch(openGroupInfo())
                if(activeRoom.roomType==="user")dispatch(openUserInfo())
              }}
            >
              <GlassCard blur={10} minWidth={'40%'} padding={12} className='text-black shadow-[rgba(106,17,203,0.3)]'>
                <div className='flex flex-col items-center text-center'>
                  <p className='text-black font-semibold'>{activeRoom.meta?.name==="Saved Messages" ? "Saved Messages" : activeRoom.roomType==="group" ? activeRoom.meta?.name :  activeRoom.meta?.username}</p>
                  { isTyping.length > 0 
                    ?<p className='text-gray-500 text-sm'>{activeRoom.roomType==="group" ? `${isTyping.map(user => user.username).join(', ')} is` : ''} typing...</p>
                    :<p className='text-gray-500 text-sm'>{activeRoom.meta?.is_online ? 'online' : 'offline'}</p>}
                </div>
              </GlassCard>
            </div>
            <div
              onClick={()=>{dispatch(openGroupInfo())}}
            >
              <GlassCard blur={10} minWidth={64} minHeight={64} padding={5} className='text-black shadow-[rgba(106,17,203,0.3)]'>
                <div className='flex items-center justify-center'>
                  <UserAvatar avatar={activeRoom.meta?.avatar} inputSize={64} username={activeRoom.meta?.username ? activeRoom.meta?.username : activeRoom.meta?.name}/>
                </div>
              </GlassCard>
            </div>
          </div>

      {hasNextPage && (
        <div className='mx-auto my-4'>
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className='rounded-full border border-(--border) bg-white/90 px-4 py-2 text-xs text-(--primary) transition hover:bg-(--primary-faded) disabled:cursor-not-allowed disabled:opacity-60'
          >
            {isFetchingNextPage ? 'Loading...' : 'Load older messages'}
          </button>
        </div>
      )}

      <div className='flex-1 overflow-y-auto px-6 flex flex-col gap-4 pt-25 pb-6'>
        {messages.map((message, index) => {
          const isCurrentUser = currentUser?.id === message.sender.id;
          const previousMessage = messages[index - 1];
          const showDayLabel = index === 0 || formatDayLabel(message.created_at) !== formatDayLabel(previousMessage?.created_at ?? '');
          const usersRead =  message.reads.map(r => r.user.username).filter( r => r!=message.sender.username);

          return (
            <div key={message.id}>
              {showDayLabel && (
                <div className='my-2 flex justify-center'>
                  <span className='rounded-full bg-white/70 px-3 py-1 text-[11px] font-medium text-slate-500'>
                    {formatDayLabel(message.created_at)}
                  </span>
                </div>
              )}
              <div
                data-message-id={message.id}
                className={`flex gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                {activeRoom?.roomType === 'group' && !isCurrentUser && (
                    <UserAvatar avatar={message.sender.avatar} inputSize={42} username={message.sender.username}  />
                  )}
                <div className={`flex flex-col min-w-[10%] max-w-[70%]`}>
                  <div className={`rounded-xl border border-(--border) px-2 ${(activeRoom?.roomType === 'group' && !isCurrentUser) ? "pt-5" : "pt-2"} pb-4 ${textSizeClass} shadow-sm ${isCurrentUser ? 'bg-(--primary) text-white' : 'bg-white/90 text-slate-900'} relative`}>
                    {activeRoom?.roomType === 'group' && !isCurrentUser && (
                      <div className='absolute left-2 top-1 text-[13px] text-(--primary)'>
                        {message.sender.username}
                      </div>
                    )}
                    {message.content}
                    <div className={`absolute right-2 bottom-0 text-[10px] ${isCurrentUser ? 'text-white/70' : 'text-slate-400'}`}>
                      {formatMessageTimestamp(message.created_at)}
                    </div>
                  </div>
                  {/* TODO: fix this read by */}
                  {activeRoom?.roomType === 'group' && usersRead.length > 0 && (
                    <div className='text-[10px] text-(--primary)/80'>
                      Read by {usersRead.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <MessageInput roomId={roomId} />
    </div>
  );
};

export default MessageThread;