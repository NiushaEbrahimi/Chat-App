// src/features/chat/MessageThread.tsx
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* load more button — infinite scroll */}
      {hasNextPage && (
        <div style={{ textAlign: 'center', padding: 8 }}>
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            style={{ fontSize: 12, color: '#666', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {isFetchingNextPage ? 'Loading...' : 'Load older messages'}
          </button>
        </div>
      )}

      {/* message list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map(message => (
          <div
            key={message.id}
            data-message-id={message.id}   // IntersectionObserver reads this
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
          >
            <div style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>
              {message.sender.username}
            </div>
            <div style={{
              background: '#f1f1f1', padding: '8px 12px',
              borderRadius: 12, maxWidth: '70%', fontSize: 14,
            }}>
              {message.content}
            </div>

            {/* read receipts */}
            {message.reads.length > 0 && (
              <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>
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