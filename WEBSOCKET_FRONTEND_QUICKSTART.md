### Socket.IO Frontend Quick Start

- **Library**: `socket.io-client@4.8.1`
- **Base URL**: `https://api.unlimtedhealth.com`
- **Namespaces**: `/chat`, `/notifications`, `/video-conference`
- **Path**: `/socket.io/`
- **Auth**: after `connect`, emit `authenticate` with `{ userId, token }`
- **Transports**: do not force; defaults work via Nginx

```bash
npm i socket.io-client@4.8.1
```

### Minimal TypeScript client
```ts
import { io, Socket } from 'socket.io-client';

type AuthPayload = { userId: string; token: string };

export function connectSocket(
  namespace: '/chat' | '/notifications' | '/video-conference',
  auth: AuthPayload,
  onEvent?: (event: string, data: unknown) => void
): Socket {
  const socket = io(`https://api.unlimtedhealth.com${namespace}`, { path: '/socket.io/' });

  socket.on('connect', () => {
    socket.emit('authenticate', auth);
  });

  socket.onAny((event, data) => {
    onEvent?.(event, data);
  });

  socket.on('disconnect', () => {});
  socket.on('connect_error', (err) => { console.error('connect_error', err); });

  return socket;
}
```

### React hook example
```ts
import { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { connectSocket } from './realtime';

export function useRealtime(namespace: '/chat' | '/notifications' | '/video-conference', userId: string, token: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const s = connectSocket(namespace, { userId, token }, (event, data) => {
      // route events to state/store as needed
    });
    socketRef.current = s;
    return () => { s.close(); };
  }, [namespace, userId, token]);

  return socketRef;
}
```

### Emitting and listening
- **Authenticate**: emitted on `connect` in the helper above
- **Listen**: `socket.on('<event>', handler)`
- **Emit**: `socket.emit('<event>', payload)`

### Notes
- Use the correct namespace per feature.
- Keep `path: '/socket.io/'`.
- Reconnection is built-in; configure as needed.


