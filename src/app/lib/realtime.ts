import { io, type Socket } from 'socket.io-client';
import { firebaseAuth } from './firebase';

function resolveSocketBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!configured) {
    return '';
  }

  try {
    const parsed = new URL(configured);
    return parsed.origin;
  } catch {
    return '';
  }
}

export async function connectRealtimeSocket(): Promise<Socket | null> {
  const currentUser = firebaseAuth.currentUser;
  if (!currentUser) {
    return null;
  }

  const idToken = await currentUser.getIdToken();
  const baseUrl = resolveSocketBaseUrl();
  const namespaceUrl = `${baseUrl}/realtime`;

  return io(namespaceUrl, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    auth: {
      token: `Bearer ${idToken}`,
    },
  });
}
