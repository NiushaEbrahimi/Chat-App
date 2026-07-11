import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Room, Message } from '../../types/chatTypes';

interface TypingUser {
  userId: string;
  username: string;
}

interface Meta {
  id?: string;
  username?: string;
  avatar?: string | null;
  is_online?: boolean;
  name?: string | null;
  avatar_url?: string;
}

type MetaType = Meta | null

interface ChatState {
  theme: "dark" | "light"
  rooms: Room[];
  messages: Record<string, Message[]>;
  activeRoom: {
    roomId: string | null;
    roomType: "group" | "saved_message" | "user";
    meta?: MetaType ;
  };
  typingUsers: Record<string, TypingUser[]>;
  onlineUserIds: string[];
}

const initialState: ChatState = {
  theme: "light" ,
  rooms: [],
  messages: {},
  activeRoom: { roomId: null, roomType: "user", meta: null },
  typingUsers: {},
  onlineUserIds: [],
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {

    toggleTheme: (state) => {
      state.theme = state.theme==="light" ? "dark" : "light";
    },
    // called when React Query fetches the room list
    setRooms: (state, action: PayloadAction<Room[]>) => {
      state.rooms = action.payload;
    },

    setActiveRoom: (state, action: PayloadAction<{ roomId: string; roomType: "group" | "saved_message" | "user"; meta?: MetaType }>) => {
      state.activeRoom.roomId = action.payload.roomId;
      state.activeRoom.roomType = action.payload.roomType;
      state.activeRoom.meta = action.payload.meta ?? null;
    },

    // called when React Query fetches message history for a room
    setMessages: (state, action: PayloadAction<{ roomId: string; messages: Message[] }>) => {
      state.messages[action.payload.roomId] = action.payload.messages;
    },

    // called when WebSocket receives a new message
    addMessage: (state, action: PayloadAction<Message>) => {
      const { room } = action.payload;
      if (!state.messages[room]) {
        state.messages[room] = [];
      }
      // avoid duplicates (optimistic update + WS echo)
      const exists = state.messages[room].some(m => m.id === action.payload.id);
      if (!exists) {
        state.messages[room].push(action.payload);
      }

      // update last_message in the room list
      const roomIndex = state.rooms.findIndex(r => r.id === room);
      if (roomIndex !== -1) {
        state.rooms[roomIndex].last_message = action.payload;
      }
    },

    // called when WebSocket receives typing_indicator
    setTyping: (state, action: PayloadAction<{
      roomId: string;
      userId: string;
      username: string;
      isTyping: boolean;
    }>) => {
      const { roomId, userId, username, isTyping } = action.payload;
      if (!state.typingUsers[roomId]) {
        state.typingUsers[roomId] = [];
      }

      if (isTyping) {
        // add if not already there
        const exists = state.typingUsers[roomId].some(u => u.userId === userId);
        if (!exists) {
          state.typingUsers[roomId].push({ userId, username });
        }
      } else {
        // remove
        state.typingUsers[roomId] = state.typingUsers[roomId].filter(
          u => u.userId !== userId
        );
      }
    },

    // called when WebSocket receives online_status
    setUserOnline: (state, action: PayloadAction<{ userId: string; isOnline: boolean }>) => {
      const { userId, isOnline } = action.payload;
      if (isOnline) {
        if (!state.onlineUserIds.includes(userId)) {
          state.onlineUserIds.push(userId);
        }
      } else {
        state.onlineUserIds = state.onlineUserIds.filter(id => id !== userId);
      }
    },

    // called when WebSocket receives message_read
    addReadReceipt: (state, action: PayloadAction<{
      messageId: string;
      roomId: string;
      user: { id: string; username: string };
    }>) => {
      const { messageId, roomId, user } = action.payload;
      const messages = state.messages[roomId];
      if (!messages) return;

      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const alreadyRead = message.reads.some(r => r.user.id === user.id);
      if (!alreadyRead) {
        message.reads.push({
          user: { id: user.id, username: user.username, avatar: null, is_online: true },
          read_at: new Date().toISOString(),
        });
      }
    },
  },
});

export const {
  toggleTheme, setRooms, setActiveRoom, setMessages,
  addMessage, setTyping, setUserOnline, addReadReceipt,
} = chatSlice.actions;

export default chatSlice.reducer;