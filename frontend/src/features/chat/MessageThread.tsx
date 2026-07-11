import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useInfiniteQuery, type QueryFunctionContext, type InfiniteData } from '@tanstack/react-query';
import GlassCard from '../../shared/GlassCard';

import { fetchMessages } from '../../api/chat';
import { setMessages } from '../../store/slices/chatSlice';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useTextSize } from '../../hooks/useTextSize';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import type { Message } from '../../types/chatTypes';
import type { RootState } from '../../store';
import UserAvatar from '../../shared/UserAvatar';

interface Props {
  roomId: string;
}

const MessageThread = ({ roomId }: Props) => {
  const dispatch = useDispatch();
  const { sendMessage } = useWebSocket();
  const { className: textSizeClass } = useTextSize();
  const messages = useSelector((s: RootState) => s.chat.messages[roomId] ?? []) as Message[];
  const activeRoom = useSelector((s: RootState) => s.chat.activeRoom);
  console.log("activeroom")
  console.log(activeRoom)
  console.log(activeRoom.meta)
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
  // TODO: change the header style
  return (
    <div className='flex h-full flex-col rounded-[28px] border border-(--border) bg-(--secondary-faded) shadow-inner shadow-[rgba(106,17,203,0.08)]'>

          <div className={`sticky h-0 top-12 z-10 rounded-[28px] flex justify-center items-center px-10`}>
            <div className='flex-1 flex justify-center'>
              <div className='w-full flex justify-center'>
                <GlassCard blur={10} minWidth={'40%'} padding={12} className='text-black shadow-[rgba(106,17,203,0.3)]'>
                  <div className='flex flex-col items-center text-center'>
                    <p className='text-black font-semibold'>{activeRoom.meta?.name}</p>
                    <p className='text-gray-500 text-sm'>{activeRoom.meta?.is_online ? 'online' : 'offline'}</p>
                  </div>
                </GlassCard>
              </div>
            </div>
            <div>
              <GlassCard blur={10} minWidth={64} minHeight={64} padding={5} className='text-black shadow-[rgba(106,17,203,0.3)]'>
                <div className='flex items-center justify-center'>
                  <UserAvatar avatar={activeRoom.meta?.avatar_url} inputSize={64} username={activeRoom.meta?.name}/>
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
        {messages.map(message => (
          <div
            key={message.id}
            data-message-id={message.id}
            className='flex flex-col items-end gap-2'
          >
            {activeRoom?.roomType === 'group' && (
              <div className='text-[11px] text-(--primary)'>
                {message.sender.username}
              </div>
            )}
            <div className={`max-w-[70%] rounded-3xl border border-(--border) bg-white/90 px-4 py-3 ${textSizeClass} text-slate-900 shadow-sm`}>
              {message.content}
            </div>

            {activeRoom?.roomType === 'group' && message.reads.length > 0 && (
              <div className='text-[10px] text-(--primary)/80'>
                Read by {message.reads.map(r => r.user.username).join(', ')}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <TypingIndicator roomId={roomId} />
      <MessageInput roomId={roomId} />
    </div>
  );
};

export default MessageThread;