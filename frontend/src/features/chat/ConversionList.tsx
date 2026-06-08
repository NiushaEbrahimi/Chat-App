import { useDispatch, useSelector } from 'react-redux';
import { setActiveRoom } from '../../store/slices/chatSlice';
import type { RootState } from '../../store';
import type { Room } from '../../types/chatTypes';

const ConversationList = () => {
  const dispatch = useDispatch();
  const rooms = useSelector((s: RootState) => s.chat.rooms);
  const activeRoomId = useSelector((s: RootState) => s.chat.activeRoomId);
  const onlineUserIds = useSelector((s: RootState) => s.chat.onlineUserIds);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #eee', fontWeight: 600 }}>
        Messages
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {rooms.map((room: Room) => {
          const isActive = room.id === activeRoomId;

          // for DMs, show the other person's name
          const displayName = room.is_group
            ? room.name
            : room.members.find(m => m.id !== room.members[0]?.id)?.username ?? 'Unknown';

          // check if any member is online
          const hasOnlineMember = room.members.some(m => onlineUserIds.includes(m.id));

          return (
            <div
              key={room.id}
              onClick={() => dispatch(setActiveRoom(room.id))}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                background: isActive ? '#f0f0f0' : 'transparent',
                borderBottom: '1px solid #f5f5f5',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              {/* online indicator dot */}
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: hasOnlineMember ? '#22c55e' : '#d1d5db',
                flexShrink: 0,
              }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{displayName}</div>
                {room.last_message && (
                  <div style={{
                    fontSize: 12, color: '#999',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {room.last_message.sender.username}: {room.last_message.content}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConversationList;