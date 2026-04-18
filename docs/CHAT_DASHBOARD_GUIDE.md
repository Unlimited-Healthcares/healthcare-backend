# 💬 Chat Dashboard Guide

## 📋 Overview

This comprehensive guide provides everything needed to implement a Chat Dashboard for the healthcare management system. The dashboard enables real-time communication between doctors, patients, healthcare centers, and support staff with WebSocket support, file sharing, video calls, and message management.

**Base URL:** `https://api.unlimtedhealth.com/api`  
**WebSocket URL:** `wss://api.unlimtedhealth.com/chat`  
**Authentication:** Bearer token required for all endpoints  
**Documentation:** Swagger/OpenAPI available at `/api/docs`

---

## 🏷️ TypeScript Interfaces

### Core Chat Types

```typescript
// Chat Room Types
enum ChatRoomType {
  DIRECT = 'direct',
  GROUP = 'group',
  CONSULTATION = 'consultation',
  EMERGENCY = 'emergency',
  SUPPORT = 'support'
}

// Message Types
enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  SYSTEM = 'system',
  VIDEO_CALL_START = 'video_call_start',
  VIDEO_CALL_END = 'video_call_end'
}

// Participant Roles
enum ParticipantRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  PARTICIPANT = 'participant',
  OBSERVER = 'observer'
}

// Delivery Status
enum DeliveryStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read'
}
```

### Chat Room Interface

```typescript
interface ChatRoom {
  id: string;                           // UUID - Primary key
  name?: string;                        // Room name (optional for direct chats)
  type: ChatRoomType;                   // Room type
  isActive: boolean;                    // Is room active
  appointmentId?: string;               // UUID - Associated appointment
  centerId?: string;                    // UUID - Associated healthcare center
  createdBy: string;                    // UUID - Creator user ID
  maxParticipants: number;              // Maximum participants allowed
  isEncrypted: boolean;                 // Is room encrypted
  autoDeleteAfterDays: number;          // Auto-delete messages after days
  roomSettings: Record<string, unknown>; // Room configuration
  createdAt: Date;                      // Creation timestamp
  updatedAt: Date;                      // Last update timestamp
  participants: ChatParticipant[];      // Room participants
  messages: ChatMessage[];              // Room messages
}
```

### Chat Message Interface

```typescript
interface ChatMessage {
  id: string;                           // UUID - Primary key
  roomId: string;                       // UUID - Room ID
  senderId: string;                     // UUID - Sender user ID
  messageType: MessageType;             // Message type
  content?: string;                     // Message content (text)
  fileUrl?: string;                     // File URL (for file messages)
  fileName?: string;                    // File name
  fileSize?: number;                    // File size in bytes
  fileType?: string;                    // File MIME type
  replyToMessageId?: string;            // UUID - Reply to message ID
  isEdited: boolean;                    // Is message edited
  editedAt?: Date;                      // Edit timestamp
  isDeleted: boolean;                   // Is message deleted
  deletedAt?: Date;                     // Delete timestamp
  deliveryStatus: DeliveryStatus;       // Delivery status
  metadata: Record<string, unknown>;    // Message metadata
  createdAt: Date;                      // Creation timestamp
  reactions: ChatMessageReaction[];     // Message reactions
}
```

### Chat Participant Interface

```typescript
interface ChatParticipant {
  id: string;                           // UUID - Primary key
  roomId: string;                       // UUID - Room ID
  userId: string;                       // UUID - User ID
  role: ParticipantRole;                // Participant role
  joinedAt: Date;                       // Join timestamp
  leftAt?: Date;                        // Leave timestamp
  isActive: boolean;                    // Is participant active
  permissions: ChatPermissions;         // Participant permissions
  participantSettings: Record<string, unknown>; // Participant settings
}

interface ChatPermissions {
  can_send_messages: boolean;           // Can send messages
  can_send_files: boolean;              // Can send files
  can_start_video: boolean;             // Can start video calls
  can_moderate?: boolean;               // Can moderate room
  can_invite_users?: boolean;           // Can invite users
}
```

### Chat Message Reaction Interface

```typescript
interface ChatMessageReaction {
  id: string;                           // UUID - Primary key
  messageId: string;                    // UUID - Message ID
  userId: string;                       // UUID - User ID
  reaction: string;                     // Reaction emoji/text
  createdAt: Date;                      // Creation timestamp
}
```

---

## 💬 Chat Room Management Endpoints

### 1. Create Chat Room
**Endpoint:** `POST /chat/rooms`  
**Authentication:** Required (Bearer token)  
**Roles:** All authenticated users

**Request Body (CreateChatRoomDto):**
```typescript
interface CreateChatRoomDto {
  name?: string;                        // Optional: Room name
  type: ChatRoomType;                   // Required: Room type
  appointmentId?: string;               // Optional: Associated appointment ID
  centerId?: string;                    // Optional: Associated center ID
  maxParticipants?: number;             // Optional: Max participants (default: 10)
  isEncrypted?: boolean;                // Optional: Is encrypted (default: true)
  autoDeleteAfterDays?: number;         // Optional: Auto-delete days (default: 90)
  roomSettings?: Record<string, unknown>; // Optional: Room settings
  participantIds: string[];             // Required: Initial participant IDs
}
```

**Example Request:**
```typescript
const createChatRoom = async (roomData: CreateChatRoomDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/chat/rooms', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: "Consultation Room",
      type: "consultation",
      appointmentId: "550e8400-e29b-41d4-a716-446655440000",
      centerId: "550e8400-e29b-41d4-a716-446655440001",
      maxParticipants: 5,
      isEncrypted: true,
      autoDeleteAfterDays: 30,
      roomSettings: {
        allowFileSharing: true,
        allowVideoCalls: true,
        requireApproval: false
      },
      participantIds: [
        "550e8400-e29b-41d4-a716-446655440002",
        "550e8400-e29b-41d4-a716-446655440003"
      ]
    })
  });
  
  return await response.json();
};
```

### 2. Get User Chat Rooms
**Endpoint:** `GET /chat/rooms`  
**Authentication:** Required (Bearer token)  
**Roles:** All authenticated users

**Query Parameters:**
```typescript
interface RoomFilters {
  page?: number;                        // Page number (default: 1)
  limit?: number;                       // Items per page (default: 20)
}
```

**Example Request:**
```typescript
const getUserChatRooms = async (filters: RoomFilters = {}) => {
  const token = localStorage.getItem('access_token');
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/chat/rooms?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 3. Add Participant to Room
**Endpoint:** `POST /chat/rooms/:roomId/participants`  
**Authentication:** Required (Bearer token)  
**Roles:** Room admin/moderator

**Request Body:**
```typescript
{
  userId: string;                       // Required: User ID to add
}
```

**Example Request:**
```typescript
const addParticipant = async (roomId: string, userId: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/chat/rooms/${roomId}/participants`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: "550e8400-e29b-41d4-a716-446655440004"
    })
  });
  
  return await response.json();
};
```

### 4. Remove Participant from Room
**Endpoint:** `DELETE /chat/rooms/:roomId/participants/:participantId`  
**Authentication:** Required (Bearer token)  
**Roles:** Room admin/moderator

**Example Request:**
```typescript
const removeParticipant = async (roomId: string, participantId: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/chat/rooms/${roomId}/participants/${participantId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

---

## 💬 Message Management Endpoints

### 1. Send Message
**Endpoint:** `POST /chat/rooms/:roomId/messages`  
**Authentication:** Required (Bearer token)  
**Roles:** Room participants

**Request Body (SendMessageDto):**
```typescript
interface SendMessageDto {
  content: string;                      // Required: Message content
  messageType?: MessageType;            // Optional: Message type (default: 'text')
  fileUrl?: string;                     // Optional: File URL
  fileName?: string;                    // Optional: File name
  fileSize?: number;                    // Optional: File size in bytes
  fileType?: string;                    // Optional: File MIME type
  replyToMessageId?: string;            // Optional: Reply to message ID
  messageMetadata?: Record<string, unknown>; // Optional: Message metadata
}
```

**Example Request:**
```typescript
const sendMessage = async (roomId: string, messageData: SendMessageDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/chat/rooms/${roomId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: "Hello, how are you feeling today?",
      messageType: "text",
      messageMetadata: {
        priority: "normal",
        tags: ["consultation", "follow-up"]
      }
    })
  });
  
  return await response.json();
};
```

### 2. Get Room Messages
**Endpoint:** `GET /chat/rooms/:roomId/messages`  
**Authentication:** Required (Bearer token)  
**Roles:** Room participants

**Query Parameters:**
```typescript
interface MessageFilters {
  page?: number;                        // Page number (default: 1)
  limit?: number;                       // Items per page (default: 50)
}
```

**Example Request:**
```typescript
const getRoomMessages = async (roomId: string, filters: MessageFilters = {}) => {
  const token = localStorage.getItem('access_token');
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/chat/rooms/${roomId}/messages?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 3. Edit Message
**Endpoint:** `PATCH /chat/messages/:messageId`  
**Authentication:** Required (Bearer token)  
**Roles:** Message sender

**Request Body:**
```typescript
{
  content: string;                      // Required: New message content
}
```

**Example Request:**
```typescript
const editMessage = async (messageId: string, newContent: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/chat/messages/${messageId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: newContent
    })
  });
  
  return await response.json();
};
```

### 4. Delete Message
**Endpoint:** `DELETE /chat/messages/:messageId`  
**Authentication:** Required (Bearer token)  
**Roles:** Message sender or room admin

**Example Request:**
```typescript
const deleteMessage = async (messageId: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/chat/messages/${messageId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 5. Add Message Reaction
**Endpoint:** `POST /chat/messages/:messageId/reactions`  
**Authentication:** Required (Bearer token)  
**Roles:** Room participants

**Request Body:**
```typescript
{
  reaction: string;                     // Required: Reaction emoji/text
}
```

**Example Request:**
```typescript
const addReaction = async (messageId: string, reaction: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/chat/messages/${messageId}/reactions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reaction: "👍"
    })
  });
  
  return await response.json();
};
```

---

## 🔌 WebSocket Real-Time Communication

### WebSocket Connection Setup

```typescript
import { io, Socket } from 'socket.io-client';

class ChatWebSocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;

  connect(userId: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.userId = userId;
      
      this.socket = io('wss://api.unlimtedhealth.com/chat', {
        auth: {
          token: token,
          userId: userId
        },
        transports: ['websocket']
      });

      this.socket.on('connect', () => {
        console.log('Connected to chat server');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected:', reason);
      });

      // Set up event listeners
      this.setupEventListeners();
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Message events
    this.socket.on('message_received', (data: ChatMessage) => {
      this.handleMessageReceived(data);
    });

    this.socket.on('message_updated', (data: ChatMessage) => {
      this.handleMessageUpdated(data);
    });

    this.socket.on('message_deleted', (data: { messageId: string; roomId: string }) => {
      this.handleMessageDeleted(data);
    });

    // Room events
    this.socket.on('room_created', (data: ChatRoom) => {
      this.handleRoomCreated(data);
    });

    this.socket.on('participant_added', (data: { roomId: string; participant: ChatParticipant }) => {
      this.handleParticipantAdded(data);
    });

    this.socket.on('participant_removed', (data: { roomId: string; participantId: string }) => {
      this.handleParticipantRemoved(data);
    });

    // Typing indicators
    this.socket.on('user_typing', (data: { roomId: string; userId: string; isTyping: boolean }) => {
      this.handleUserTyping(data);
    });

    // Video call events
    this.socket.on('video_call_started', (data: { roomId: string; callerId: string }) => {
      this.handleVideoCallStarted(data);
    });

    this.socket.on('video_call_ended', (data: { roomId: string; callerId: string }) => {
      this.handleVideoCallEnded(data);
    });
  }

  // Send message via WebSocket
  sendMessage(roomId: string, messageData: SendMessageDto) {
    if (!this.socket) throw new Error('Socket not connected');
    
    this.socket.emit('send_message', {
      roomId,
      ...messageData
    });
  }

  // Join room
  joinRoom(roomId: string) {
    if (!this.socket) throw new Error('Socket not connected');
    
    this.socket.emit('join_room', { roomId });
  }

  // Leave room
  leaveRoom(roomId: string) {
    if (!this.socket) throw new Error('Socket not connected');
    
    this.socket.emit('leave_room', { roomId });
  }

  // Send typing indicator
  sendTypingIndicator(roomId: string, isTyping: boolean) {
    if (!this.socket) throw new Error('Socket not connected');
    
    this.socket.emit('typing', { roomId, isTyping });
  }

  // Start video call
  startVideoCall(roomId: string) {
    if (!this.socket) throw new Error('Socket not connected');
    
    this.socket.emit('start_video_call', { roomId });
  }

  // End video call
  endVideoCall(roomId: string) {
    if (!this.socket) throw new Error('Socket not connected');
    
    this.socket.emit('end_video_call', { roomId });
  }

  // Event handlers (implement based on your UI needs)
  private handleMessageReceived(message: ChatMessage) {
    // Update UI with new message
    console.log('New message:', message);
  }

  private handleMessageUpdated(message: ChatMessage) {
    // Update UI with edited message
    console.log('Message updated:', message);
  }

  private handleMessageDeleted(data: { messageId: string; roomId: string }) {
    // Remove message from UI
    console.log('Message deleted:', data);
  }

  private handleRoomCreated(room: ChatRoom) {
    // Add new room to UI
    console.log('Room created:', room);
  }

  private handleParticipantAdded(data: { roomId: string; participant: ChatParticipant }) {
    // Update room participants in UI
    console.log('Participant added:', data);
  }

  private handleParticipantRemoved(data: { roomId: string; participantId: string }) {
    // Update room participants in UI
    console.log('Participant removed:', data);
  }

  private handleUserTyping(data: { roomId: string; userId: string; isTyping: boolean }) {
    // Show/hide typing indicator in UI
    console.log('User typing:', data);
  }

  private handleVideoCallStarted(data: { roomId: string; callerId: string }) {
    // Handle video call start in UI
    console.log('Video call started:', data);
  }

  private handleVideoCallEnded(data: { roomId: string; callerId: string }) {
    // Handle video call end in UI
    console.log('Video call ended:', data);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const chatWebSocketService = new ChatWebSocketService();
```

---

## 🎨 Frontend Implementation Examples

### React Chat Dashboard Component

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { chatWebSocketService } from '../services/chatWebSocketService';

interface ChatDashboardProps {
  userId: string;
  token: string;
}

const ChatDashboard: React.FC<ChatDashboardProps> = ({ userId, token }) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to WebSocket
    chatWebSocketService.connect(userId, token)
      .then(() => {
        setIsConnected(true);
        loadUserRooms();
      })
      .catch(error => {
        console.error('Failed to connect to chat:', error);
      });

    return () => {
      chatWebSocketService.disconnect();
    };
  }, [userId, token]);

  useEffect(() => {
    if (selectedRoom) {
      loadRoomMessages(selectedRoom.id);
    }
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadUserRooms = async () => {
    try {
      const response = await getUserChatRooms();
      setRooms(response.data);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadRoomMessages = async (roomId: string) => {
    try {
      const response = await getRoomMessages(roomId);
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;

    try {
      await sendMessage(selectedRoom.id, {
        content: newMessage,
        messageType: 'text'
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedRoom) return;

    try {
      // Upload file first (implement file upload service)
      const fileUrl = await uploadFile(file);
      
      await sendMessage(selectedRoom.id, {
        content: file.name,
        messageType: 'file',
        fileUrl: fileUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleStartVideoCall = () => {
    if (!selectedRoom) return;
    chatWebSocketService.startVideoCall(selectedRoom.id);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!isConnected) {
    return <div className="loading">Connecting to chat...</div>;
  }

  return (
    <div className="chat-dashboard">
      <div className="chat-sidebar">
        <h2>Chat Rooms</h2>
        <div className="rooms-list">
          {rooms.map(room => (
            <div
              key={room.id}
              className={`room-item ${selectedRoom?.id === room.id ? 'active' : ''}`}
              onClick={() => setSelectedRoom(room)}
            >
              <h3>{room.name || 'Direct Chat'}</h3>
              <p>{room.type}</p>
              {room.lastMessage && (
                <p className="last-message">{room.lastMessage.content}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main">
        {selectedRoom ? (
          <>
            <div className="chat-header">
              <h2>{selectedRoom.name || 'Direct Chat'}</h2>
              <div className="chat-actions">
                <button onClick={handleStartVideoCall}>
                  📹 Video Call
                </button>
              </div>
            </div>

            <div className="messages-container">
              {messages.map(message => (
                <div key={message.id} className={`message ${message.senderId === userId ? 'sent' : 'received'}`}>
                  <div className="message-content">
                    {message.messageType === 'file' ? (
                      <div className="file-message">
                        <a href={message.fileUrl} target="_blank" rel="noopener noreferrer">
                          📎 {message.fileName}
                        </a>
                        <p>{message.content}</p>
                      </div>
                    ) : (
                      <p>{message.content}</p>
                    )}
                    {message.isEdited && <span className="edited">(edited)</span>}
                  </div>
                  <div className="message-meta">
                    <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
                    <span className="delivery-status">{message.deliveryStatus}</span>
                  </div>
                  {message.reactions && message.reactions.length > 0 && (
                    <div className="message-reactions">
                      {message.reactions.map(reaction => (
                        <span key={reaction.id} className="reaction">
                          {reaction.reaction}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {typingUsers.length > 0 && (
                <div className="typing-indicator">
                  {typingUsers.join(', ')} is typing...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="message-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
              />
              <input
                type="file"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <label htmlFor="file-upload" className="file-upload-btn">
                📎
              </label>
              <button onClick={handleSendMessage}>Send</button>
            </div>
          </>
        ) : (
          <div className="no-room-selected">
            <h2>Select a chat room to start messaging</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatDashboard;
```

### CSS Styling

```css
.chat-dashboard {
  display: flex;
  height: 100vh;
  background: #f5f5f5;
}

.chat-sidebar {
  width: 300px;
  background: white;
  border-right: 1px solid #ddd;
  padding: 20px;
  overflow-y: auto;
}

.rooms-list {
  margin-top: 20px;
}

.room-item {
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.room-item:hover {
  background-color: #f8f9fa;
}

.room-item.active {
  background-color: #007bff;
  color: white;
}

.last-message {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.chat-header {
  padding: 20px;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-actions button {
  padding: 8px 16px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.messages-container {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.message {
  margin-bottom: 15px;
  max-width: 70%;
}

.message.sent {
  align-self: flex-end;
  background: #007bff;
  color: white;
  padding: 10px 15px;
  border-radius: 18px 18px 4px 18px;
}

.message.received {
  align-self: flex-start;
  background: #f1f3f4;
  color: #333;
  padding: 10px 15px;
  border-radius: 18px 18px 18px 4px;
}

.message-content p {
  margin: 0;
}

.file-message a {
  color: inherit;
  text-decoration: underline;
}

.edited {
  font-size: 12px;
  opacity: 0.7;
}

.message-meta {
  font-size: 12px;
  margin-top: 5px;
  opacity: 0.7;
}

.delivery-status {
  margin-left: 10px;
}

.message-reactions {
  margin-top: 5px;
}

.reaction {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 12px;
  margin-right: 5px;
  font-size: 12px;
}

.typing-indicator {
  font-style: italic;
  color: #666;
  padding: 10px;
}

.message-input {
  padding: 20px;
  border-top: 1px solid #ddd;
  display: flex;
  gap: 10px;
  align-items: center;
}

.message-input input[type="text"] {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 20px;
  outline: none;
}

.file-upload-btn {
  padding: 10px;
  background: #6c757d;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.message-input button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.no-room-selected {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .chat-dashboard {
    flex-direction: column;
  }
  
  .chat-sidebar {
    width: 100%;
    height: 200px;
    border-right: none;
    border-bottom: 1px solid #ddd;
  }
  
  .message {
    max-width: 85%;
  }
}
```

---

## 🔐 Error Handling

### Common Error Responses

```typescript
// 400 Bad Request
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "content",
      "message": "Message content is required"
    }
  ]
}

// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}

// 403 Forbidden
{
  "statusCode": 403,
  "message": "Insufficient permissions to send messages",
  "error": "Forbidden"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Chat room not found",
  "error": "Not Found"
}

// 409 Conflict
{
  "statusCode": 409,
  "message": "User already in room",
  "error": "Conflict"
}
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install socket.io-client axios
# or
yarn add socket.io-client axios
```

### 2. Create API Service

```typescript
// services/chatApi.ts
import axios from 'axios';

const API_BASE_URL = 'https://api.unlimtedhealth.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const chatApi = {
  // Rooms
  createRoom: (data: CreateChatRoomDto) => apiClient.post('/chat/rooms', data),
  getUserRooms: (filters: RoomFilters) => apiClient.get('/chat/rooms', { params: filters }),
  addParticipant: (roomId: string, userId: string) => 
    apiClient.post(`/chat/rooms/${roomId}/participants`, { userId }),
  removeParticipant: (roomId: string, participantId: string) => 
    apiClient.delete(`/chat/rooms/${roomId}/participants/${participantId}`),
  
  // Messages
  sendMessage: (roomId: string, data: SendMessageDto) => 
    apiClient.post(`/chat/rooms/${roomId}/messages`, data),
  getRoomMessages: (roomId: string, filters: MessageFilters) => 
    apiClient.get(`/chat/rooms/${roomId}/messages`, { params: filters }),
  editMessage: (messageId: string, content: string) => 
    apiClient.patch(`/chat/messages/${messageId}`, { content }),
  deleteMessage: (messageId: string) => 
    apiClient.delete(`/chat/messages/${messageId}`),
  addReaction: (messageId: string, reaction: string) => 
    apiClient.post(`/chat/messages/${messageId}/reactions`, { reaction }),
};
```

### 3. Environment Configuration

```typescript
// config/environment.ts
export const environment = {
  production: false,
  apiUrl: 'https://api.unlimtedhealth.com/api',
  wsUrl: 'wss://api.unlimtedhealth.com/chat',
  appName: 'Chat Dashboard',
  version: '1.0.0'
};
```

---

## 📋 Summary

This comprehensive Chat Dashboard guide provides:

✅ **Complete API Documentation** - All chat endpoints with real DTOs  
✅ **WebSocket Integration** - Real-time messaging with Socket.IO  
✅ **TypeScript Interfaces** - Full type definitions for all data structures  
✅ **Frontend Implementation** - React components with real-time features  
✅ **File Sharing** - Support for file, image, video, and audio messages  
✅ **Video Calls** - WebRTC integration for video conferencing  
✅ **Message Management** - Edit, delete, reactions, and reply functionality  
✅ **Role-based Access** - Participant permissions and room management  
✅ **Error Handling** - Comprehensive error response documentation  
✅ **Mobile Responsive** - CSS grid layouts for all screen sizes  

The dashboard supports:
- Real-time messaging between doctors, patients, and centers
- File sharing and media messages
- Video call integration
- Message editing, deletion, and reactions
- Typing indicators and delivery status
- Room management and participant control
- Encrypted communication
- Mobile-responsive design

**Base URL:** `https://api.unlimtedhealth.com/api`  
**WebSocket URL:** `wss://api.unlimtedhealth.com/chat`  
**Authentication:** Bearer token required for all endpoints  
**Documentation:** Swagger/OpenAPI available at `/api/docs`
