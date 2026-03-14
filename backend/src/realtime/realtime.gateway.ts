import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import type { AuthUser } from '../common/interfaces/auth-user.interface';

type AuthenticatedSocket = Socket & {
  data: {
    authUser?: AuthUser;
  };
};

const realtimeCorsOriginRaw = (process.env.CORS_ORIGIN ?? '*').trim();
const realtimeCorsOrigins = realtimeCorsOriginRaw
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: realtimeCorsOriginRaw === '*' ? true : realtimeCorsOrigins,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly authService: AuthService) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    const token = this.extractBearerToken(client);
    if (!token) {
      client.emit('realtime.error', { code: 'missing_token' });
      client.disconnect(true);
      return;
    }

    try {
      const authUser = await this.authService.verifyAndResolveUser(token);
      client.data.authUser = authUser;
      client.join(this.getClinicRoom(authUser.clinicId));
      client.join(this.getUserRoom(authUser.userId));

      client.emit('realtime.connected', {
        connectedAt: new Date().toISOString(),
        clientId: client.id,
        clinicId: authUser.clinicId,
        userId: authUser.userId,
        role: authUser.role,
      });
    } catch (error) {
      this.logger.warn(
        `Rejected realtime socket id=${client.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      client.emit('realtime.error', { code: 'unauthorized' });
      client.disconnect(true);
    }
  }

  handleDisconnect(_client: AuthenticatedSocket): void {
    // noop
  }

  emitToClinic(clinicId: string, event: string, payload: unknown): void {
    if (!clinicId) {
      return;
    }
    this.server.to(this.getClinicRoom(clinicId)).emit(event, payload);
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    if (!userId) {
      return;
    }
    this.server.to(this.getUserRoom(userId)).emit(event, payload);
  }

  private getClinicRoom(clinicId: string): string {
    return `clinic:${clinicId}`;
  }

  private getUserRoom(userId: string): string {
    return `user:${userId}`;
  }

  private extractBearerToken(client: AuthenticatedSocket): string | null {
    const authTokenRaw = (client.handshake.auth as Record<string, unknown> | undefined)?.token;
    const headerTokenRaw = client.handshake.headers?.authorization;
    const queryTokenRaw =
      typeof client.handshake.query?.token === 'string' ? client.handshake.query.token : null;

    const candidates: Array<string | null | undefined> = [
      typeof authTokenRaw === 'string' ? authTokenRaw : null,
      typeof headerTokenRaw === 'string' ? headerTokenRaw : null,
      queryTokenRaw,
    ];

    for (const rawCandidate of candidates) {
      if (!rawCandidate) {
        continue;
      }
      const raw = rawCandidate.trim();
      if (!raw) {
        continue;
      }
      if (raw.toLowerCase().startsWith('bearer ')) {
        const token = raw.slice('bearer '.length).trim();
        if (token) {
          return token;
        }
        continue;
      }
      return raw;
    }

    return null;
  }
}
