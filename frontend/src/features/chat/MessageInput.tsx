// src/features/chat/MessageInput.tsx
import { useState, useRef, useCallback } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';

interface Props {
  roomId: string;
}

const MessageInput = ({ roomId }: Props) => {
  const [value, setValue] = useState('');
  const { sendMessage } = useWebSocket();
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTyping = useRef(false);

  const handleTyping = useCallback(() => {
    // send typing_start only once per typing session
    if (!isTyping.current) {
      isTyping.current = true;
      sendMessage({ type: 'typing_start', room_id: roomId });
    }

    // reset the timer — if user stops typing for 2s, send typing_stop
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      isTyping.current = false;
      sendMessage({ type: 'typing_stop', room_id: roomId });
    }, 2000);
  }, [roomId, sendMessage]);

  const handleSend = () => {
    const content = value.trim();
    if (!content) return;

    sendMessage({
      type: 'send_message',
      room_id: roomId,
      content,
    });

    // stop typing indicator immediately on send
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    isTyping.current = false;
    sendMessage({ type: 'typing_stop', room_id: roomId });

    setValue('');
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
        placeholder='Type a message... (Enter to send)'
        rows={1}
        className='min-h-14 z-100 flex-1 resize-none rounded-[26px] border border-(--border) bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-(--primary) focus:ring-2 focus:ring-(--primary-faded)'
      />
      <button
        onClick={handleSend}
        disabled={!value.trim()}
        className='rounded-[26px] bg-(--primary) px-5 py-3 text-sm font-semibold text-white transition hover:bg-(--secondary) disabled:cursor-not-allowed disabled:opacity-40'
      >
        Send
      </button>
    </div>
  );
};

export default MessageInput;