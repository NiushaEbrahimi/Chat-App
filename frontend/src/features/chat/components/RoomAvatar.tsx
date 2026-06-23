import { Bookmark, Users } from 'lucide-react'
import { getRoomAvatar } from '../../../utils/getRoomAvatar'
import type { Room } from '../../../types/chatTypes'

interface Props {
  room: Room
  currentUserId?: string
  size?: number
}

const RoomAvatar = ({ room, currentUserId, size = 36 }: Props) => {
  const avatar = getRoomAvatar(room, currentUserId)

  const base: React.CSSProperties = {
    width: size, height: size, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, fontSize: size * 0.4, fontWeight: 600,
  }

  if (avatar.type === 'image') {
    return <img src={avatar.url} style={{ ...base, objectFit: 'cover' }} alt="" />
  }

  if (avatar.type === 'initials') {
    return (
      <div style={{ ...base, background: 'var(--primary)', color: '#fff' }}>
        {avatar.text}
      </div>
    );
  }

  return (
    <div style={{ ...base, background: 'var(--secondary-faded)', color: 'var(--primary)' }}>
      {avatar.name === 'bookmark' ? <Bookmark size={size * 0.5} /> : <Users size={size * 0.5} />}
    </div>
  );
}

export default RoomAvatar