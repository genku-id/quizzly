import { io } from 'socket.io-client';

// In development (Vite port 5173), connect to localhost:3001.
// In production (Render, custom domain, etc.), connect directly to current origin!
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (
  typeof window !== 'undefined' && window.location.port === '5173'
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : (typeof window !== 'undefined' ? window.location.origin : '')
);

export const socket = io(BACKEND_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling']
});
