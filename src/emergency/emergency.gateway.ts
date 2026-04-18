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

@WebSocketGateway(0, {
    namespace: '/emergency',
    cors: {
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
        credentials: true,
        methods: ['GET', 'POST'],
    },
})
export class EmergencyGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(EmergencyGateway.name);
    private userSockets: Map<string, Socket[]> = new Map();

    constructor() { }

    handleConnection(client: Socket) {
        this.logger.log(`Emergency tracking client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        for (const [userId, sockets] of this.userSockets.entries()) {
            const index = sockets.findIndex(s => s.id === client.id);
            if (index > -1) {
                sockets.splice(index, 1);
                if (sockets.length === 0) this.userSockets.delete(userId);
                break;
            }
        }
    }

    @SubscribeMessage('authenticate')
    handleAuthentication(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string; token: string }
    ) {
        const { userId } = data;
        if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, []);
        }
        this.userSockets.get(userId)!.push(client);
        client.join(`user_${userId}`);
        client.emit('authenticated', { success: true });
    }

    @SubscribeMessage('watch_request')
    handleWatchRequest(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { requestId: string }
    ) {
        client.join(`request_${data.requestId}`);
    }

    @SubscribeMessage('unwatch_request')
    handleUnwatchRequest(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { requestId: string }
    ) {
        client.leave(`request_${data.requestId}`);
    }

    sendLocationUpdate(requestId: string, location: { latitude: number; longitude: number; speed?: number; heading?: number }) {
        if (this.server) {
            this.server.to(`request_${requestId}`).emit('ambulance_location_update', { requestId, ...location });
        }
    }

    sendStatusUpdate(requestId: string, status: string, trackingNumber?: string) {
        if (this.server) {
            this.server.to(`request_${requestId}`).emit('request_status_update', { requestId, status, trackingNumber });
        }
    }
}
