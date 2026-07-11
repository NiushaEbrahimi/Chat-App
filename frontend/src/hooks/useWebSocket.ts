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
  const pingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isManualClose = useRef(false);  // true when we close on purpose (logout)
  const tokenRef = useRef(token);  // keep token in ref to avoid dependency chain issues

  // Update token ref whenever it changes
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);

      // Handle pong messages
      if (data.type === 'pong') {
        return;
      }

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

  const setupHeartbeat = useCallback(() => {
    // Clear existing heartbeat
    if (pingTimeout.current) {
      clearTimeout(pingTimeout.current);
    }

    // Send ping every 30 seconds to keep connection alive
    const sendPing = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
      // Schedule next ping
      pingTimeout.current = setTimeout(sendPing, 30000);
    };

    pingTimeout.current = setTimeout(sendPing, 30000);
  }, []);

  const connect = useCallback(() => {
    if (!tokenRef.current) return;

    // Don't create multiple connections
    if (wsRef.current?.readyState === WebSocket.CONNECTING || 
        wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(`${WS_URL}/ws/chat/?token=${tokenRef.current}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      reconnectAttempt.current = 0;  // reset backoff on successful connect
      setupHeartbeat();  // Start sending pings
    };

    ws.onmessage = handleMessage;

    ws.onclose = (event) => {
      if (pingTimeout.current) {
        clearTimeout(pingTimeout.current);
      }

      if (isManualClose.current) return;  // don't reconnect on logout

      // 4001 = our unauthorized code — token expired
      // refresh happens in axios interceptor, then reconnect with new token
      if (event.code === 4001) {
        console.warn('WS unauthorized — waiting for token refresh');
        return;
      }

      // anything else — reconnect with exponential backoff
      const delay = getBackoffDelay(reconnectAttempt.current);
      console.log(`WS disconnected (code: ${event.code}). Reconnecting in ${delay}ms...`);

      reconnectTimeout.current = setTimeout(() => {
        reconnectAttempt.current += 1;
        connect();
      }, delay);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      // onclose fires after onerror — let that handle reconnect
      ws.close();
    };
  }, [handleMessage, setupHeartbeat]);

  // send helper — components use this to send messages to the server
  const sendMessage = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  // connect when authenticated, disconnect when logged out
  useEffect(() => {
    if (isAuthenticated && tokenRef.current) {
      isManualClose.current = false;
      connect();
    } else {
      // logged out — close cleanly
      isManualClose.current = true;
      if (pingTimeout.current) {
        clearTimeout(pingTimeout.current);
      }
      wsRef.current?.close();
    }

    return () => {
      // cleanup on unmount
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (pingTimeout.current) {
        clearTimeout(pingTimeout.current);
      }
      isManualClose.current = true;
      wsRef.current?.close();
    };
  }, [isAuthenticated, connect]);

  return { sendMessage };
};