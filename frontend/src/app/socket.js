import { io } from 'socket.io-client';
import { getAccessToken } from './api';

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
  }
  return '/';
};

export const socket = io(getSocketUrl(), {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

export function connectSocket(user) {
  if (!user) return;

  // Attach the current JWT access token dynamically for server-side authentication
  // A callback ensures the latest token is fetched on every auto-reconnect attempt
  socket.auth = (cb) => {
    cb({ token: getAccessToken() });
  };

  socket.connect();
}

export function disconnectSocket() {
  socket.disconnect();
}
