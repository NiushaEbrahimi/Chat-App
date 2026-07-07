import type { Room } from '../types/chatTypes'
import { resolveAvatarUrl } from './resolveAvatarUrl'

export type AvatarResult =
  | { type: 'image'; url: string }
  | { type: 'initials'; text: string }
  | { type: 'icon'; name: 'bookmark' | 'users' }

export function getRoomAvatar(room: Room, currentUserId?: string): AvatarResult {
  if (room.is_saved_messages) {
    return { type: 'icon', name: 'bookmark' }
  }

  if (!room.is_group) {
    const other = room.members.find(m => m.id !== currentUserId)
    if (other?.avatar) return { type: 'image', url: resolveAvatarUrl(other.avatar) || other.avatar }
    return { type: 'initials', text: other?.username?.[0]?.toUpperCase() ?? '?' }
  }

  if (room.avatar_url) {
    return { type: 'image', url: resolveAvatarUrl(room.avatar_url) || room.avatar_url }
  }

  if (room.name) {
    return { type: 'initials', text: room.name[0].toUpperCase() }
  }

  return { type: 'icon', name: 'users' }
}