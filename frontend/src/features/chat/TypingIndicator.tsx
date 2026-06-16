// src/features/chat/TypingIndicator.tsx
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  roomId: string;
}

const TypingIndicator = ({ roomId }: Props) => {
  const { user } = useAuth();
  const typingUsers = useSelector((s: RootState) =>
    // filter out the current user — you don't see your own typing indicator
    (s.chat.typingUsers[roomId] ?? []).filter(u => u.userId !== user?.id)
  );

  if (typingUsers.length === 0) return null;

  const text = typingUsers.length === 1
    ? `${typingUsers[0].username} is typing...`
    : `${typingUsers.map(u => u.username).join(', ')} are typing...`;

  return (
    <div style={{ padding: '4px 16px', fontSize: 12, color: '#999', height: 24 }}>
      {text}
    </div>
  );
};

export default TypingIndicator;