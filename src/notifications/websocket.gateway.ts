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

interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  userId: string;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

interface AlertData {
  type: string;
  title: string;
  message: string;
  severity: 'warning' | 'error' | 'critical';
  actionRequired?: boolean;
  metadata?: Record<string, unknown>;
}

interface SystemNotification {
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  targetAudience?: string[];
  metadata?: Record<string, unknown>;
}

@WebSocketGateway(0, {
  namespace: '/notifications',
  cors: {
    origin: [
      'http://217.21.78.192:3001',
      'https://unlimtedhealth.com',
      'https://app.unlimtedhealth.com',
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    credentials: true,
    methods: ['GET', 'POST'],
  },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private userSockets: Map<string, Socket[]> = new Map();

  constructor() {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Remove client from user mapping
    for (const [userId, sockets] of this.userSockets.entries()) {
      const index = sockets.findIndex(socket => socket.id === client.id);
      if (index > -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          this.userSockets.delete(userId);
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
      }
      this.userSockets.get(userId)!.push(client);
      
      client.join(`user_${userId}`);
      client.emit('authenticated', { success: true });
      
      this.logger.log(`User ${userId} authenticated with socket ${client.id}`);
    } catch (error) {
      client.emit('authentication_error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  @SubscribeMessage('join_center')
  async handleJoinCenter(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { centerId: string }
  ) {
    client.join(`center_${data.centerId}`);
    this.logger.log(`Client ${client.id} joined center room: ${data.centerId}`);
  }

  @SubscribeMessage('leave_center')
  async handleLeaveCenter(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { centerId: string }
  ) {
    client.leave(`center_${data.centerId}`);
    this.logger.log(`Client ${client.id} left center room: ${data.centerId}`);
  }

  // Send notification to specific user
  async sendToUser(userId: string, notification: NotificationData) {
    if (this.server) {
      this.server.to(`user_${userId}`).emit('notification', notification);
    }
  }

  // Send notification to all users in a center
  async sendToCenter(centerId: string, notification: NotificationData) {
    if (this.server) {
      this.server.to(`center_${centerId}`).emit('center_notification', notification);
    }
  }

  // Send urgent alert
  async sendUrgentAlert(userId: string, alert: AlertData) {
    if (this.server) {
      this.server.to(`user_${userId}`).emit('urgent_alert', alert);
    }
  }

  // Broadcast system-wide notification
  async broadcastSystemNotification(notification: SystemNotification) {
    if (this.server) {
      this.server.emit('system_notification', notification);
    }
  }
}
