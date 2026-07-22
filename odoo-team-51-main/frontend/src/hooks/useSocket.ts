import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

let sharedSocket: Socket | null = null;

function getSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io(BASE_URL, { transports: ['websocket'], autoConnect: true });
  }
  return sharedSocket;
}

/**
 * Subscribes to the backend's 4 real-time events for the lifetime of the
 * calling component. Event names match sockets/events.ts on the backend
 * exactly — order:status_changed, stock:updated, signal:created,
 * audit:entry_created.
 */
export function useSocketEvent<T = unknown>(event: string, handler: (payload: T) => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    const wrapped = (payload: T) => handlerRef.current(payload);
    socket.on(event, wrapped);
    return () => {
      socket.off(event, wrapped);
    };
  }, [event]);
}
