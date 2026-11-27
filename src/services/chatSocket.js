import { io } from 'socket.io-client';
import { auth } from '../firebase/firebase';
import { API_BASE_URL } from './apiClient';

/**
 * Real-time chat connection. Authenticates with a fresh Firebase ID token on every (re)connect and asks the server
 * to join the event's chat room; the server decides whether we may (ticket for paid events). The client only receives
 * events - messages and moderation actions are sent through the REST API and broadcast by the server.
 */
export function connectChatSocket(eventId, handlers = {}) {
  const socket = io(API_BASE_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    auth: async (cb) => {
      try {
        cb({ token: await auth.currentUser?.getIdToken() });
      } catch {
        cb({ token: '' });
      }
    },
  });

  const relay = (event, handler) => socket.on(event, (payload) => handler?.(payload));

  socket.on('connect', () => {
    socket.emit('join-room', { eventId }, (result) => {
      if (result?.ok) handlers.onJoined?.();
      else handlers.onDenied?.(result?.error || 'Could not join chat');
    });
  });
  socket.on('disconnect', (reason) => handlers.onDisconnected?.(reason));
  socket.on('connect_error', (err) => handlers.onError?.(err?.message || 'Connection error'));
  socket.io.on('reconnect_attempt', () => handlers.onReconnecting?.());

  relay('new-message', handlers.onMessage);
  relay('message-updated', handlers.onMessageUpdated);
  relay('message-removed', handlers.onMessageRemoved);
  relay('user-mute-changed', handlers.onMuteChanged);
  relay('user-timed-out', handlers.onTimeout);
  relay('user-ban-changed', handlers.onBanChanged);

  return {
    close() {
      socket.emit('leave-room', { eventId });
      socket.removeAllListeners();
      socket.disconnect();
    },
  };
}
