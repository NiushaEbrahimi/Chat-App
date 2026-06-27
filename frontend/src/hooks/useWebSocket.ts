import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useAuth } from './useAuth';
import {
  addMessage, setTyping, setUserOnline, addReadReceipt
} from '../store/slices/chatSlice';
import type { Message } from '../types/chatTypes';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000';

// exponential backoff delays in ms: 1s, 2s, 4s, 8s, 16s, 30s max
const getBackoffDelay = (attempt: number) =>
  Math.min(1000 * Math.pow(2, attempt), 30000);

export const useWebSocket = () => {
  const dispatch = useDispatch();
  const { token, isAuthenticated } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isManualClose = useRef(false);  // true when we close on purpose (logout)

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {

        case 'new_message':
          // WebSocket received a new message — add it to Redux
          dispatch(addMessage({
            id: data.message_id,
            room: data.room_id,
            sender: {
              id: data.sender_id,
              username: data.sender_username,
              avatar: null,
              is_online: true,
            },
            content: data.content,
            message_type: 'text',
            attachment: null,
            is_edited: false,
            created_at: data.created_at,
            reads: [],
            reactions: [],
          } as Message));
          break;

        case 'typing_indicator':
          dispatch(setTyping({
            roomId: data.room_id,
            userId: data.user_id,
            username: data.username,
            isTyping: data.is_typing,
          }));
          break;

        case 'online_status':
          dispatch(setUserOnline({
            userId: data.user_id,
            isOnline: data.is_online,
          }));
          break;

        case 'message_read':
          dispatch(addReadReceipt({
            messageId: data.message_id,
            roomId: data.room_id,
            user: { id: data.user_id, username: data.username },
          }));
          break;
      }
    } catch {
      console.error('Failed to parse WebSocket message');
    }
  }, [dispatch]);

  const connect = useCallback(() => {
    if (!token) return;

    // close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(`${WS_URL}/ws/chat/?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      // console.log('WebSocket connected');
      reconnectAttempt.current = 0;  // reset backoff on successful connect
    };

    ws.onmessage = handleMessage;

    ws.onclose = (event) => {
      if (isManualClose.current) return;  // don't reconnect on logout

      // 4001 = our unauthorized code — token expired
      // refresh happens in axios interceptor, then reconnect with new token
      if (event.code === 4001) {
        console.warn('WS unauthorized — waiting for token refresh');
        return;
      }

      // anything else — reconnect with exponential backoff
      const delay = getBackoffDelay(reconnectAttempt.current);
      // console.log(`WS disconnected. Reconnecting in ${delay}ms...`);

      reconnectTimeout.current = setTimeout(() => {
        reconnectAttempt.current += 1;
        connect();
      }, delay);
    };

    ws.onerror = () => {
      // onclose fires after onerror — let that handle reconnect
      ws.close();
    };
  }, [token, handleMessage]);

  // send helper — components use this to send messages to the server
  const sendMessage = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  // connect when authenticated, disconnect when logged out
  useEffect(() => {
    if (isAuthenticated && token) {
      isManualClose.current = false;
      connect();
    } else {
      // logged out — close cleanly
      isManualClose.current = true;
      wsRef.current?.close();
    }

    return () => {
      // cleanup on unmount
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      isManualClose.current = true;
      wsRef.current?.close();
    };
  }, [isAuthenticated, token, connect]);

  // reconnect when token changes (after refresh)
  useEffect(() => {
    if (token && wsRef.current?.readyState === WebSocket.CLOSED) {
      connect();
    }
  }, [token, connect]);

  return { sendMessage };
};