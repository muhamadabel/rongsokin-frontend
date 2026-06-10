import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (token: string): Socket => {
  if (!socket) {
    // Default ke BE hosting supaya app jalan tanpa .env (lihat catatan di lib/axios.ts).
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://be-rongsokin.hallojanu.xyz';
    socket = io(socketUrl, {
      auth: { token },
      autoConnect: true,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
