import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService } from './services/chat.service';
import { SendMessageDto } from './dto/send-message.dto';

interface ChatMessageData {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  messageType: string;
  createdAt: Date;
  isEdited?: boolean;
  editedAt?: Date;
  reactions?: Array<{
    id: string;
    reaction: string;
    userId: string;
  }>;
}

interface ChatRoomData {
  id: string;
  name: string;
  type: string;
  participants: Array<{
    userId: string;
    role: string;
    isActive: boolean;
  }>;
  lastMessage?: ChatMessageData;
  updatedAt: Date;
}

@WebSocketGateway(0, {
  namespace: '/chat',
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: true,
    methods: ['GET', 'POST'],
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private userSockets: Map<string, Socket[]> = new Map();
  private userRooms: Map<string, Set<string>> = new Map(); // userId -> Set of roomIds

  constructor(private chatService: ChatService) { }

  handleConnection(client: Socket) {
    this.logger.log(`Chat client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Chat client disconnected: ${client.id}`);

    // Remove client from user mapping
    for (const [userId, sockets] of this.userSockets.entries()) {
      const index = sockets.findIndex(socket => socket.id === client.id);
      if (index > -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          this.userSockets.delete(userId);
          this.userRooms.delete(userId);
        }
        break;
      }
    }
  }

  @SubscribeMessage('authenticate')
  async handleAuthentication(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; token: string }
  ) {
    try {
      // In a real implementation, verify the JWT token here
      const { userId } = data;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
        this.userRooms.set(userId, new Set());
      }
      this.userSockets.get(userId)!.push(client);

      client.join(`user_${userId}`);
      client.emit('authenticated', { success: true });

      this.logger.log(`User ${userId} authenticated with chat socket ${client.id}`);
    } catch (error) {
      client.emit('authentication_error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string }
  ) {
    try {
      const { roomId, userId } = data;

      // Verify user is participant in the room by trying to get room messages
      await this.chatService.getChatRoomMessages(roomId, userId, 1, 1);

      client.join(`room_${roomId}`);

      if (!this.userRooms.has(userId)) {
        this.userRooms.set(userId, new Set());
      }
      this.userRooms.get(userId)!.add(roomId);

      client.emit('room_joined', { roomId, success: true });
      this.logger.log(`User ${userId} joined chat room: ${roomId}`);
    } catch (error) {
      client.emit('room_join_error', {
        roomId: data.roomId,
        message: error.message
      });
    }
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string }
  ) {
    const { roomId, userId } = data;

    client.leave(`room_${roomId}`);

    if (this.userRooms.has(userId)) {
      this.userRooms.get(userId)!.delete(roomId);
    }

    client.emit('room_left', { roomId, success: true });
    this.logger.log(`User ${userId} left chat room: ${roomId}`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; message: SendMessageDto; userId: string }
  ) {
    try {
      const { roomId, message, userId } = data;

      // Send message through service
      const savedMessage = await this.chatService.sendMessage(roomId, message, userId);

      // Broadcast to all users in the room
      const messageData: ChatMessageData = {
        id: savedMessage.id,
        roomId: savedMessage.roomId,
        senderId: savedMessage.senderId,
        content: savedMessage.content,
        messageType: savedMessage.messageType || 'text',
        createdAt: savedMessage.createdAt,
        isEdited: savedMessage.isEdited,
        editedAt: savedMessage.editedAt,
        reactions: savedMessage.reactions || [],
      };

      this.server.to(`room_${roomId}`).emit('new_message', messageData);

      // Notify sender of successful send
      client.emit('message_sent', { messageId: savedMessage.id, success: true });

      this.logger.log(`Message sent in room ${roomId} by user ${userId}`);
    } catch (error) {
      client.emit('message_error', {
        message: error.message,
        roomId: data.roomId
      });
    }
  }

  @SubscribeMessage('edit_message')
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; content: string; userId: string }
  ) {
    try {
      const { messageId, content, userId } = data;

      const updatedMessage = await this.chatService.editMessage(messageId, content, userId);

      const messageData: ChatMessageData = {
        id: updatedMessage.id,
        roomId: updatedMessage.roomId,
        senderId: updatedMessage.senderId,
        content: updatedMessage.content,
        messageType: updatedMessage.messageType || 'text',
        createdAt: updatedMessage.createdAt,
        isEdited: updatedMessage.isEdited,
        editedAt: updatedMessage.editedAt,
        reactions: updatedMessage.reactions || [],
      };

      this.server.to(`room_${updatedMessage.roomId}`).emit('message_edited', messageData);

      client.emit('message_edit_success', { messageId, success: true });
    } catch (error) {
      client.emit('message_edit_error', {
        messageId: data.messageId,
        message: error.message
      });
    }
  }

  @SubscribeMessage('delete_message')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; userId: string; roomId: string }
  ) {
    try {
      const { messageId, userId, roomId } = data;

      await this.chatService.deleteMessage(messageId, userId);

      this.server.to(`room_${roomId}`).emit('message_deleted', {
        messageId,
        roomId,
        deletedBy: userId,
      });

      client.emit('message_delete_success', { messageId, success: true });
    } catch (error) {
      client.emit('message_delete_error', {
        messageId: data.messageId,
        message: error.message
      });
    }
  }

  @SubscribeMessage('add_reaction')
  async handleAddReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; reaction: string; userId: string; roomId: string }
  ) {
    try {
      const { messageId, reaction, userId, roomId } = data;

      const result = await this.chatService.addReaction(messageId, reaction, userId);

      this.server.to(`room_${roomId}`).emit('reaction_updated', {
        messageId,
        reaction,
        userId,
        action: result.action,
        reactionData: result.reaction,
      });

      client.emit('reaction_success', { messageId, reaction, success: true });
    } catch (error) {
      client.emit('reaction_error', {
        messageId: data.messageId,
        reaction: data.reaction,
        message: error.message
      });
    }
  }

  @SubscribeMessage('typing_start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string }
  ) {
    const { roomId, userId } = data;

    // Broadcast typing indicator to all users in room except sender
    client.to(`room_${roomId}`).emit('user_typing', {
      roomId,
      userId,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing_stop')
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string }
  ) {
    const { roomId, userId } = data;

    // Broadcast typing stop to all users in room except sender
    client.to(`room_${roomId}`).emit('user_typing', {
      roomId,
      userId,
      isTyping: false,
    });
  }

  // Send message to specific room
  async sendToRoom(roomId: string, message: ChatMessageData) {
    this.server.to(`room_${roomId}`).emit('new_message', message);
  }

  // Send system message to room
  async sendSystemMessage(roomId: string, message: string, metadata?: Record<string, unknown>) {
    this.server.to(`room_${roomId}`).emit('system_message', {
      roomId,
      message,
      timestamp: new Date(),
      metadata,
    });
  }

  // Notify user about new chat room
  async notifyNewRoom(userId: string, roomData: ChatRoomData) {
    this.server.to(`user_${userId}`).emit('new_chat_room', roomData);
  }

  // Notify user about room updates
  async notifyRoomUpdate(userId: string, roomData: ChatRoomData) {
    this.server.to(`user_${userId}`).emit('room_updated', roomData);
  }

  @SubscribeMessage('start_video_call')
  handleStartVideoCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string }
  ) {
    const { roomId, userId } = data;
    this.server.to(`room_${roomId}`).emit('incoming_video_call', {
      roomId,
      callerId: userId,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('start_audio_call')
  handleStartAudioCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string }
  ) {
    const { roomId, userId } = data;
    this.server.to(`room_${roomId}`).emit('incoming_audio_call', {
      roomId,
      callerId: userId,
      timestamp: new Date(),
    });
  }
}