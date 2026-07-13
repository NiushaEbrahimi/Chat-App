// not used for now ( don't know if i like the istyping in header or down in MessageThread)
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import { useAuth } from '../../../hooks/useAuth';

interface Props {
  roomId: string;
}

const TypingIndicator = ({ roomId }: Props) => {
  const { user } = useAuth();
  const typingUsers = useSelector((s: RootState) =>
    (s.chat.typingUsers[roomId] ?? []).filter(u => u.userId !== user?.id)
  );

  if (typingUsers.length === 0) return null;

  const text = typingUsers.length === 1
    ? `${typingUsers[0].username} is typing...`
    : `${typingUsers.map(u => u.username).join(', ')} are typing...`;

  return (
    <div className='mx-6 mb-2 rounded-full bg-white/80 px-4 py-2 text-xs text-[color:var(--primary)] shadow-sm'>
      {text}
    </div>
  );
};

export default TypingIndicator;