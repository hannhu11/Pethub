import { Injectable } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';

@Injectable()
export class RealtimeService {
  constructor(private readonly gateway: RealtimeGateway) {}

  emitNotificationCreated(payload: unknown): void {
    this.gateway.broadcast('notification.created', payload);
  }

  emitNotificationRead(payload: unknown): void {
    this.gateway.broadcast('notification.read', payload);
  }

  emitAppointmentUpdated(payload: unknown): void {
    this.gateway.broadcast('appointment.updated', payload);
  }

  emitReminderUpdated(payload: unknown): void {
    this.gateway.broadcast('reminder.updated', payload);
  }

  emitSubscriptionUpdated(payload: unknown): void {
    this.gateway.broadcast('subscription.updated', payload);
  }
}
