declare module '@nestjs/websockets' {
  import { Server, Socket } from 'socket.io';

  export interface WsResponse<T = unknown> {
    event: string;
    data: T;
  }

  export interface OnGatewayInit {
    afterInit(server: Server): void;
  }

  export interface OnGatewayConnection {
    handleConnection(client: Socket, ...args: unknown[]): void;
  }

  export interface OnGatewayDisconnect {
    handleDisconnect(client: Socket): void;
  }

  export declare function WebSocketGateway(port?: number, options?: unknown): ClassDecorator;
  export declare function SubscribeMessage(message: string): MethodDecorator;
  export declare function MessageBody(): ParameterDecorator;
  export declare function ConnectedSocket(): ParameterDecorator;
  export declare function WebSocketServer(): PropertyDecorator;
} 