import { Injectable } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';

type ClinicScopedPayload = {
  clinicId: string;
  userId?: string | null;
  [key: string]: unknown;
};

type InvoicePaymentUpdatedPayload = {
  clinicId: string;
  invoiceId: string;
  appointmentId: string | null;
  paymentStatus: 'paid' | 'unpaid' | 'refunded';
  paidAt: string | null;
  orderCode?: string | null;
};

@Injectable()
export class RealtimeService {
  constructor(private readonly gateway: RealtimeGateway) {}

  emitNotificationCreated(payload: ClinicScopedPayload): void {
    this.gateway.emitToClinic(payload.clinicId, 'notification.created', payload);
  }

  emitNotificationRead(payload: ClinicScopedPayload): void {
    if (payload.userId) {
      this.gateway.emitToUser(payload.userId, 'notification.read', payload);
    }
    this.gateway.emitToClinic(payload.clinicId, 'notification.read', payload);
  }

  emitAppointmentUpdated(payload: ClinicScopedPayload): void {
    this.gateway.emitToClinic(payload.clinicId, 'appointment.updated', payload);
  }

  emitReminderUpdated(payload: ClinicScopedPayload): void {
    this.gateway.emitToClinic(payload.clinicId, 'reminder.updated', payload);
  }

  emitSubscriptionUpdated(payload: ClinicScopedPayload): void {
    this.gateway.emitToClinic(payload.clinicId, 'subscription.updated', payload);
  }

  emitInvoicePaymentUpdated(payload: InvoicePaymentUpdatedPayload): void {
    this.gateway.emitToClinic(payload.clinicId, 'invoice.payment.updated', payload);
  }
}
