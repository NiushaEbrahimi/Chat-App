import { useState, useRef, useCallback } from 'react';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import { createRoom } from '../../../api/chat';
import { setActiveRoom, setPendingChat } from '../../../store/slices/chatSlice';
import type { ChatUser } from '../../../types/chatTypes';
import React from 'react';

interface Props {
  roomId?: string;
  bottomRef : React.RefObject<HTMLDivElement | null>
  onSendScroll : () => void
}

const MessageInput = ({ roomId, bottomRef, onSendScroll }: Props) => {
  const [value, setValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { sendMessage } = useWebSocket();
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTyping = useRef(false);
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const rooms = useSelector((s: RootState) => s.chat.rooms);
  const pendingChat = useSelector((s: RootState) => s.chat.pendingChat);
  const currentUserId = useSelector((s: RootState) => s.auth.user?.id);

  const handleTyping = useCallback(() => {
    if (!roomId) return;
    if (!isTyping.current) {
      isTyping.current = true;
      sendMessage({ type: 'typing_start', room_id: roomId });
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      isTyping.current = false;
      sendMessage({ type: 'typing_stop', room_id: roomId });
    }, 2000);
  }, [roomId, sendMessage]);

  const handleSend = async () => {
    const content = value.trim();
    if (!content || isSending) return;

    setIsSending(true);

    try {
      if (pendingChat && !roomId) {
        const response = await createRoom({
          name: pendingChat.username,
          is_group: false,
          member_ids: [pendingChat.userId],
        });
        const newRoom = response.data;
        const other = newRoom.members.find((m: ChatUser) => m.id !== currentUserId);

        sendMessage({
          type: 'send_message',
          room_id: newRoom.id,
          content,
        });

        dispatch(setActiveRoom({
          roomId: newRoom.id,
          roomType: 'user',
          meta: other ?? newRoom,
        }));
        dispatch(setPendingChat(null));
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
      } else if (roomId) {
        sendMessage({
          type: 'send_message',
          room_id: roomId,
          content,
        });

        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        isTyping.current = false;
        sendMessage({ type: 'typing_stop', room_id: roomId });

        const isFirstMessage = !rooms.some(r => r.id === roomId);
        if (isFirstMessage) {
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
          }, 500);
        }
      }

      setValue('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      onSendScroll();
      setIsSending(false);
      // scrollIntoView removed from here — MessageThread handles it once
      // the message actually shows up in `messages`
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className='flex items-center justify-center gap-3 rounded-b-[28px] px-45 mb-12' style={{height:"0px"}}>
      <textarea
        value={value}
        onChange={e => { setValue(e.target.value); handleTyping(); }}
        onKeyDown={handleKeyDown}
        placeholder={pendingChat ? `Message @${pendingChat.username}` : 'Type a message... (Enter to send)'}
        rows={1}
        className='min-h-14 z-100 flex-1 resize-none rounded-[26px] border border-(--border) bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-(--primary) focus:ring-2 focus:ring-(--primary-faded)'
      />
      <button
        onClick={handleSend}
        disabled={!value.trim() || isSending}
        className='rounded-[26px] bg-(--primary) px-5 py-3 text-sm font-semibold text-white transition hover:bg-(--secondary) disabled:cursor-not-allowed disabled:opacity-40'
      >
        {isSending ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
};

export default MessageInput;
