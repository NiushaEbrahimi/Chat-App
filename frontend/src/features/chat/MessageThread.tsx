import { useEffect, useRef, useState } from 'react';
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
import { openGroupInfo, openUserInfo, setUserPanel } from '../../store/slices/uiSlice';
import Spinner from '../../shared/Spinner';
import { LucideCircle, LucideCircleArrowDown, LucideCircleArrowUp } from 'lucide-react';

interface Props {
  roomId?: string;
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
  const pendingChat = useSelector((s: RootState) => s.chat.pendingChat);
  const messages = useSelector((s: RootState) => roomId ? (s.chat.messages[roomId] ?? []) : []) as Message[];
  const activeRoom = useSelector((s: RootState) => s.chat.activeRoom);
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const bottomRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [isNearTop, setIsNearTop] = useState(false);

  // scroll to bottom instantly when entering a new room
  const hasScrolledForRoomRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!roomId || !messages.length) return;
    if (hasScrolledForRoomRef.current === roomId) return;
    hasScrolledForRoomRef.current = roomId;
    // wait a tick for DOM to settle, then jump to bottom
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' });
    });
  }, [roomId, messages]);

  // track scroll position to show/hide jump-to-bottom button
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const threshold = 100;
    setIsNearBottom(el.scrollHeight - el.scrollTop - el.clientHeight < threshold);
    setIsNearTop(el.scrollTop < threshold);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isPending = !roomId && !!pendingChat;

  // snapshot the first unread index when the room opens — stays stable even after messages are marked read
  const [firstUnreadIndex, setFirstUnreadIndex] = useState(-1);
  const snapshottedRoomIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!roomId || !messages.length) return;
    // only snapshot once per room
    if (snapshottedRoomIdRef.current === roomId) return;
    snapshottedRoomIdRef.current = roomId;
    const idx = messages.findIndex(m => !m.reads.some(r => r.user.id === currentUser?.id));
     setFirstUnreadIndex(idx);
  }, [roomId, messages, currentUser?.id]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery<
    { data: { results: Message[]; next: string | null } },
    Error,
    { data: { results: Message[]; next: string | null } },
    [string, string | undefined]
  >({
    queryKey: ['messages', roomId],
    queryFn: (context: QueryFunctionContext) => fetchMessages(roomId!, context.pageParam as string | undefined),
    getNextPageParam: (lastPage) => lastPage.data.next ?? undefined,
    initialPageParam: undefined,
    enabled: !!roomId,
  });

  const typedData = data as InfiniteData<{ data: { results: Message[]; next: string | null } }> | undefined;

  // flatten all pages into Redux — reverse each page individually so order is correct
  useEffect(() => {
    if (typedData && roomId) {
      const allMessages = typedData.pages.flatMap(p => [...p.data.results].reverse());
      dispatch(setMessages({ roomId, messages: allMessages }));
    }
  }, [typedData, roomId, dispatch]);

  // mark messages as read using IntersectionObserver
  useEffect(() => {
    if (isPending) return;

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
  }, [messages, sendMessage, isPending]);

  const isTyping = useSelector((s: RootState) => roomId ? (s.chat.typingUsers[roomId] ?? []).filter(u => u.userId !== currentUser?.id) : []);
  if (isLoading) {
    return (
      <div className='flex h-full items-center justify-center rounded-[28px] border border-(--border) bg-(--secondary-faded)'>
        <Spinner />
      </div>
    );
  }

  const headerName = isPending
    ? pendingChat!.username
    : activeRoom.meta?.name === "Saved Messages"
      ? "Saved Messages"
      : activeRoom.meta?.username ?? activeRoom.meta?.name;

  const headerAvatar = isPending ? pendingChat!.avatar : activeRoom.meta?.avatar;
  const headerOnline = isPending ? pendingChat!.is_online : activeRoom.meta?.is_online;

  const handleHeaderClick = () => {
    if (isPending) return;
    if (activeRoom.roomType === "group") dispatch(openGroupInfo());
    if (activeRoom.roomType === "user") {
      dispatch(setUserPanel({
        roomId: activeRoom.roomId,
        meta: {
          id: activeRoom.meta?.id ?? '',
          username: activeRoom.meta?.username ?? '',
          avatar: activeRoom.meta?.avatar ?? null,
          is_online: activeRoom.meta?.is_online ?? false,
        },
      }));
      dispatch(openUserInfo());
    }
  };

  return (
    <div className='flex h-full flex-col rounded-[28px] border border-(--border) bg-(--secondary-faded) shadow-inner shadow-[rgba(106,17,203,0.08)] relative'>
      {/* TODO: this doesn't get affected by navbar/scrollbar and it ruins width*/}
      <div className={`sticky h-0 top-12 z-10 rounded-[28px] flex justify-center items-center px-10`}>
        <div className='relative w-full'>
          <div
            className='flex-1 flex justify-center'
            onClick={handleHeaderClick}
          >
            <GlassCard blur={10} minWidth={'40%'} padding={12} className='text-black shadow-[rgba(106,17,203,0.3)]'>
              <div className='flex flex-col items-center text-center'>
                <p className='text-black font-semibold'>{headerName}</p>
                {isTyping.length > 0
                  ?<p className='text-gray-500 text-sm'>{activeRoom.roomType==="group" ? `${isTyping.map(user => user.username).join(', ')} is` : ''} typing...</p>
                  :<p className='text-gray-500 text-sm'>{headerOnline ? 'online' : 'offline'}</p>}
              </div>
            </GlassCard>
          </div>
          <div
            className='absolute top-0 right-5'
            onClick={handleHeaderClick}
          >
            <GlassCard blur={10} minWidth={64} minHeight={64} padding={5} className='text-black shadow-[rgba(106,17,203,0.3)]'>
              <div className='flex items-center justify-center'>
                <UserAvatar avatar={headerAvatar} inputSize={64} username={headerName ?? ''}/>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {isPending ? (
      <div className='flex-1 flex items-center justify-center text-slate-500'>
        <p className='text-sm'>Send a message to start the conversation</p>
      </div>
      ) : (
      <>
        {isNearTop && hasNextPage && (
          <div className='mx-auto my-4 absolute top-20 left-6 z-100'>
            <button
              onClick={() =>fetchNextPage()}
              // disabled={isFetchingNextPage}
              className='flex items-center gap-1 rounded-full border border-(--border) bg-(--primary) p-2 text-xs text-white transition hover:bg-(--primary-faded) disabled:cursor-not-allowed disabled:opacity-60'
            >
              <LucideCircleArrowUp/>
              {isFetchingNextPage ? 'Loading...' : 'Load messages'}
            </button>
          </div>
        )}

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className='flex-1 overflow-y-auto px-6 flex flex-col gap-4 pt-25 pb-6 relative'
        >
          <div ref={topRef} />
          {messages.map((message, index) => {
            const isCurrentUser = currentUser?.id === message.sender.id;
            const previousMessage = messages[index - 1];
            const showDayLabel = index === 0 || formatDayLabel(message.created_at) !== formatDayLabel(previousMessage?.created_at ?? '');
            const usersRead = message.reads
              .filter(r => r.user.id !== currentUser?.id)
              .map(r => r.user.username);

            return (
              <div key={message.id}>
                {index === firstUnreadIndex && firstUnreadIndex !== -1 && (
                  <div className='flex items-center gap-2 my-2'>
                    <div className='flex-1 h-px bg-(--primary)' />
                    <span className='text-[10px] font-semibold text-(--primary) uppercase'>New Messages</span>
                    <div className='flex-1 h-px bg-(--primary)' />
                  </div>
                )}
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
                    {isCurrentUser && usersRead.length > 0 && (
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
        {!isNearBottom && (
          <button
            onClick={scrollToBottom}
            className='absolute bottom-24 left-6 z-10 rounded-full bg-(--primary) p-3 text-white shadow-lg transition hover:bg-(--primary-faded)'
          >
            <LucideCircleArrowDown/>
          </button>
        )}
      </>
      )}

      <MessageInput roomId={roomId} />
    </div>
  );
};

export default MessageThread;