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
    <div style={{
      padding: '20px 24px', borderTop: '1px solid #eee',
      display: 'flex', gap: 8, alignItems: 'flex-end',
    }}>
      <textarea
        value={value}
        onChange={e => { setValue(e.target.value); handleTyping(); }}
        onKeyDown={handleKeyDown}
        placeholder="Type a message... (Enter to send)"
        rows={1}
        style={{
          flex: 1, padding: '10px 12px', borderRadius: 20,
          border: '1px solid #ddd', resize: 'none',
          fontSize: 14, outline: 'none', fontFamily: 'inherit',
        }}
      />
      <button
        onClick={handleSend}
        disabled={!value.trim()}
        style={{
          padding: '10px 18px', background: '#111', color: '#fff',
          border: 'none', borderRadius: 20, cursor: 'pointer',
          fontSize: 14, opacity: value.trim() ? 1 : 0.4,
        }}
      >
        Send
      </button>
    </div>
  );
};

export default MessageInput;