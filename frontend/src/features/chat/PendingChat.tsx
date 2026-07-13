import { useSelector } from 'react-redux';
import UserAvatar from '../../shared/UserAvatar';
import { resolveAvatarUrl } from '../../utils/resolveAvatarUrl';
import type { RootState } from '../../store';
import MessageInput from './components/MessageInput';
import GlassCard from '../../shared/GlassCard';

export default function PendingChat() {
  const pendingChat = useSelector((s: RootState) => s.chat.pendingChat);

  if (!pendingChat) return null;

  const avatar = resolveAvatarUrl(pendingChat.avatar ?? undefined);

  return (
    <div className='flex h-full flex-col rounded-[28px] border border-(--border) bg-(--secondary-faded) shadow-inner shadow-[rgba(106,17,203,0.08)]'>
      <div className='sticky h-0 top-12 z-10 rounded-[28px] flex justify-center items-center px-10'>
        <GlassCard blur={10} minWidth={'40%'} padding={12} className='text-black shadow-[rgba(106,17,203,0.3)]'>
          <div className='flex flex-col items-center text-center'>
            <p className='text-black font-semibold'>{pendingChat.username}</p>
            <p className='text-gray-500 text-sm'>
              {pendingChat.is_online ? 'online' : 'offline'}
            </p>
          </div>
        </GlassCard>
        <GlassCard blur={10} minWidth={64} minHeight={64} padding={5} className='text-black shadow-[rgba(106,17,203,0.3)]'>
          <div className='flex items-center justify-center'>
            <UserAvatar avatar={avatar} inputSize={64} username={pendingChat.username} />
          </div>
        </GlassCard>
      </div>

      <div className='flex-1 flex items-center justify-center text-slate-500'>
        <p className='text-sm'>Send a message to start the conversation</p>
      </div>

      <MessageInput />
    </div>
  );
}
