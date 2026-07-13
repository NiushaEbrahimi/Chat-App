import apiClient from './client';
import type { Room, Message } from '../types/chatTypes';

export const fetchRooms = (): Promise<{ data: Room[] }> =>
  apiClient.get('/api/chat/rooms/');

export const createRoom = (data: { name?: string; is_group: boolean; member_ids: string[] }) =>
  apiClient.post('/api/chat/rooms/', data);

// pageParam is the URL for the next page — used by useInfiniteQuery
export const fetchMessages = (roomId: string, pageParam?: string): Promise<{ data: { results: Message[]; next: string | null } }> =>
  pageParam
    ? apiClient.get(pageParam)
    : apiClient.get(`/api/chat/rooms/${roomId}/messages/`);

export const fetchSavedMessage = (): Promise<{ data: Room }> =>
  apiClient.get('/api/chat/rooms/saved/');

export const updateRoom = (roomId: string, data: FormData) =>
  apiClient.patch(`/api/chat/rooms/${roomId}/`, data);

export const deleteRoom = (roomId: string) =>
  apiClient.delete(`/api/chat/rooms/${roomId}/`);