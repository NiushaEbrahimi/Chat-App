import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useInfiniteQuery } from '@tanstack/react-query';

import { fetchMessages } from '../../api/chat';
import { setMessages } from '../../store/slices/chatSlice';
import { useWebSocket } from '../../hooks/useWebSocket';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import type { RootState } from '../../store';

interface Props {
  roomId: string;
}

const MessageThread = ({ roomId }: Props) => {
  const dispatch = useDispatch();
  const { sendMessage } = useWebSocket();
  const messages = useSelector((s: RootState) => s.chat.messages[roomId] ?? []);
  const activeRooType = useSelector((s: RootState) => s.chat.activeRoomType);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['messages', roomId],
    queryFn: ({ pageParam }) => fetchMessages(roomId, pageParam as string | undefined),
    getNextPageParam: (lastPage) => lastPage.data.next ?? undefined,
    initialPageParam: undefined,
  });

  // flatten all pages into Redux
  useEffect(() => {
    if (data) {
      const allMessages = data.pages.flatMap(p => p.data.results).reverse();
      dispatch(setMessages({ roomId, messages: allMessages }));
    }
  }, [data, roomId, dispatch]);

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
    <div className='flex h-full flex-col rounded-[28px] border border-[var(--border)] bg-[var(--secondary-faded)] shadow-inner shadow-[rgba(106,17,203,0.08)]'>
      <div className='sticky top-0 z-10 overflow-hidden rounded-t-[28px] bg-[var(--primary)]/10 px-6 py-5 backdrop-blur-sm'>
        <div className='flex items-center justify-between gap-4'>
          <div>
            <p className='text-sm font-semibold text-[var(--primary)]'>Conversation</p>
            <p className='text-xs text-slate-500'>Live messages sync in real time</p>
          </div>
          <span className='rounded-full bg-[var(--primary-faded)] px-3 py-1 text-xs font-semibold text-[var(--primary)]'>
            Chat
          </span>
        </div>
      </div>

      {hasNextPage && (
        <div className='mx-auto my-4'>
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className='rounded-full border border-[var(--border)] bg-white/90 px-4 py-2 text-xs text-[var(--primary)] transition hover:bg-[var(--primary-faded)] disabled:cursor-not-allowed disabled:opacity-60'
          >
            {isFetchingNextPage ? 'Loading...' : 'Load older messages'}
          </button>
        </div>
      )}

      <div className='flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4'>
        {messages.map(message => (
          <div
            key={message.id}
            data-message-id={message.id}
            className='flex flex-col items-end gap-2'
          >
            {activeRooType === 'group' && (
              <div className='text-[11px] text-[var(--primary)]'>
                {message.sender.username}
              </div>
            )}
            <div className='max-w-[70%] rounded-[24px] border border-[var(--border)] bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm'>
              {message.content}
            </div>

            {activeRooType === 'group' && message.reads.length > 0 && (
              <div className='text-[10px] text-[var(--primary)]/80'>
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