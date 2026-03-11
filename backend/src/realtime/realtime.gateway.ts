import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket): void {
    client.emit('realtime.connected', {
      connectedAt: new Date().toISOString(),
      clientId: client.id,
    });
  }

  handleDisconnect(_client: Socket): void {
    // noop
  }

  broadcast(event: string, payload: unknown): void {
    this.server.emit(event, payload);
  }
}
