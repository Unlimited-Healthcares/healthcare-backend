declare module 'socket.io' {
  export class Server {
    emit(event: string, data: unknown): boolean;
    to(room: string): Server;
    in(room: string): Server;
    of(namespace: string): Namespace;
    
    on(event: 'connection', listener: (socket: Socket) => void): this;
    on(event: string, listener: (...args: unknown[]) => void): this;
  }

  export class Namespace {
    emit(event: string, data: unknown): boolean;
    to(room: string): Namespace;
    in(room: string): Namespace;
  }

  export class Socket {
    id: string;
    client: unknown;
    conn: unknown;
    rooms: { [id: string]: string };
    handshake: Handshake;
    
    emit(event: string, data: unknown): boolean;
    join(room: string): void;
    leave(room: string): void;
    to(room: string): Socket;
    in(room: string): Socket;
    disconnect(close?: boolean): void;
    
    on(event: string, callback: (...args: unknown[]) => void): this;
    once(event: string, callback: (...args: unknown[]) => void): this;
  }

  export interface Handshake {
    headers: object;
    time: string;
    address: string;
    xdomain: boolean;
    secure: boolean;
    issued: number;
    url: string;
    query: object;
    auth: object;
  }
} 