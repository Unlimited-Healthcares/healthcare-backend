# WebSocket Frontend Integration Guide

## Problem Fixed ✅

The backend now has proper WebSocket proxy configuration in Nginx. The frontend was trying to connect to Socket.IO endpoints that don't exist.

## Backend WebSocket Endpoints Available

The backend provides these WebSocket namespaces:

1. **Chat WebSocket**: `wss://api.unlimtedhealth.com/chat`
2. **Notifications WebSocket**: `wss://api.unlimtedhealth.com/notifications`  
3. **Video Conference WebSocket**: `wss://api.unlimtedhealth.com/video-conference`

## Frontend Code Changes Required

### ❌ Remove Socket.IO Client

**Remove this:**
```typescript
import io from 'socket.io-client';

const socket = io('wss://api.unlimtedhealth.com/socket.io/', {
  transports: ['websocket']
});
```

### ✅ Use Native WebSocket or WebSocket Library

**Option 1: Native WebSocket (Recommended)**
```typescript
// Chat WebSocket Connection
class ChatWebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(userId: string, token: string) {
    try {
      this.socket = new WebSocket('wss://api.unlimtedhealth.com/chat');
      
      this.socket.onopen = () => {
        console.log('🔌 Connected to chat WebSocket');
        this.reconnectAttempts = 0;
        
        // Authenticate with the server
        this.send('authenticate', { userId, token });
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('🔌 Disconnected from chat WebSocket', event.code, event.reason);
        this.handleReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect(userId, token); // You'll need to store these
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private send(event: string, data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ event, data }));
    }
  }

  private handleMessage(data: any) {
    switch (data.event) {
      case 'authenticated':
        console.log('✅ Chat authentication successful');
        break;
      case 'message_received':
        // Handle incoming chat message
        this.onMessageReceived?.(data.data);
        break;
      case 'user_joined':
        // Handle user joining room
        this.onUserJoined?.(data.data);
        break;
      case 'user_left':
        // Handle user leaving room
        this.onUserLeft?.(data.data);
        break;
      default:
        console.log('Unknown WebSocket event:', data.event);
    }
  }

  // Public methods for chat functionality
  joinRoom(roomId: string) {
    this.send('join_room', { roomId });
  }

  leaveRoom(roomId: string) {
    this.send('leave_room', { roomId });
  }

  sendMessage(roomId: string, message: string) {
    this.send('send_message', { roomId, message });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  // Event handlers (set these from your components)
  onMessageReceived?: (message: any) => void;
  onUserJoined?: (user: any) => void;
  onUserLeft?: (user: any) => void;
}
```

**Option 2: Using a WebSocket Library (like `ws` or `@types/ws`)**
```typescript
import WebSocket from 'ws';

// Similar implementation but using the ws library
// This is useful if you need more advanced WebSocket features
```

### Notifications WebSocket

```typescript
class NotificationWebSocketService {
  private socket: WebSocket | null = null;

  connect(userId: string, token: string) {
    this.socket = new WebSocket('wss://api.unlimtedhealth.com/notifications');
    
    this.socket.onopen = () => {
      console.log('🔌 Connected to notifications WebSocket');
      this.send('authenticate', { userId, token });
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleNotification(data);
    };

    this.socket.onclose = () => {
      console.log('🔌 Disconnected from notifications WebSocket');
    };
  }

  private send(event: string, data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ event, data }));
    }
  }

  private handleNotification(data: any) {
    switch (data.event) {
      case 'notification_received':
        // Show notification to user
        this.showNotification?.(data.data);
        break;
      case 'system_alert':
        // Handle system alerts
        this.showSystemAlert?.(data.data);
        break;
    }
  }

  joinCenter(centerId: string) {
    this.send('join_center', { centerId });
  }

  showNotification?: (notification: any) => void;
  showSystemAlert?: (alert: any) => void;
}
```

### Video Conference WebSocket

```typescript
class VideoConferenceWebSocketService {
  private socket: WebSocket | null = null;

  connect(userId: string, token: string) {
    this.socket = new WebSocket('wss://api.unlimtedhealth.com/video-conference');
    
    this.socket.onopen = () => {
      console.log('🔌 Connected to video conference WebSocket');
      this.send('authenticate', { userId, token });
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleConferenceEvent(data);
    };
  }

  private send(event: string, data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ event, data }));
    }
  }

  private handleConferenceEvent(data: any) {
    switch (data.event) {
      case 'participant_joined':
        this.onParticipantJoined?.(data.data);
        break;
      case 'participant_left':
        this.onParticipantLeft?.(data.data);
        break;
      case 'conference_ended':
        this.onConferenceEnded?.(data.data);
        break;
    }
  }

  joinConference(conferenceId: string) {
    this.send('join_conference', { conferenceId });
  }

  leaveConference(conferenceId: string) {
    this.send('leave_conference', { conferenceId });
  }

  onParticipantJoined?: (participant: any) => void;
  onParticipantLeft?: (participant: any) => void;
  onConferenceEnded?: (conference: any) => void;
}
```

## Usage in React Components

```typescript
// In your React component
import { useEffect, useRef } from 'react';

const ChatPage = () => {
  const chatServiceRef = useRef<ChatWebSocketService | null>(null);

  useEffect(() => {
    // Initialize chat service
    chatServiceRef.current = new ChatWebSocketService();
    
    // Set event handlers
    chatServiceRef.current.onMessageReceived = (message) => {
      // Update your chat UI
      console.log('New message:', message);
    };

    chatServiceRef.current.onUserJoined = (user) => {
      // Update user list
      console.log('User joined:', user);
    };

    // Connect to WebSocket
    chatServiceRef.current.connect(userId, token);

    // Cleanup on unmount
    return () => {
      chatServiceRef.current?.disconnect();
    };
  }, [userId, token]);

  const sendMessage = (message: string) => {
    chatServiceRef.current?.sendMessage(roomId, message);
  };

  return (
    <div>
      {/* Your chat UI */}
    </div>
  );
};
```

## Testing the Connection

You can test the WebSocket connection in the browser console:

```javascript
// Test chat WebSocket
const chatSocket = new WebSocket('wss://api.unlimtedhealth.com/chat');
chatSocket.onopen = () => console.log('Chat WebSocket connected');
chatSocket.onmessage = (event) => console.log('Chat message:', event.data);
chatSocket.onerror = (error) => console.error('Chat WebSocket error:', error);

// Test notifications WebSocket
const notificationSocket = new WebSocket('wss://api.unlimtedhealth.com/notifications');
notificationSocket.onopen = () => console.log('Notifications WebSocket connected');
notificationSocket.onmessage = (event) => console.log('Notification:', event.data);
notificationSocket.onerror = (error) => console.error('Notifications WebSocket error:', error);
```

## Key Changes Summary

1. **Remove Socket.IO client** - The backend doesn't use Socket.IO
2. **Use native WebSocket** - Connect to the correct endpoints
3. **Update connection URLs** - Use the proper WebSocket namespaces
4. **Handle authentication** - Send auth data after connection
5. **Implement reconnection logic** - Handle connection drops gracefully

## Backend WebSocket Events

The backend expects these events:

### Chat Events
- `authenticate` - Authenticate user
- `join_room` - Join a chat room
- `leave_room` - Leave a chat room
- `send_message` - Send a message

### Notification Events
- `authenticate` - Authenticate user
- `join_center` - Join a healthcare center for notifications

### Video Conference Events
- `authenticate` - Authenticate user
- `join_conference` - Join a video conference
- `leave_conference` - Leave a video conference

The WebSocket connections should now work properly! 🎉
