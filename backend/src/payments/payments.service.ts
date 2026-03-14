import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import axios from 'axios';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreatePayosLinkDto } from './dto/create-payos-link.dto';
import { RealtimeService } from '../realtime/realtime.service';
import type { AuthUser } from '../common/interfaces/auth-user.interface';

type CreatePayosLinkInput = {
  clinicId: string;
  amount: number;
  description: string;
  orderCode?: string;
  invoiceId?: string;
  returnUrl?: string;
  cancelUrl?: string;
};

type NormalizedWebhookPayload = {
  orderCode?: string;
  status?: string;
  amount?: number;
  signature?: string;
  code?: string;
  desc?: string;
  success?: boolean;
  data?: Record<string, unknown>;
};

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async createPayosLink(dto: CreatePayosLinkDto, currentUser: AuthUser) {
    if (currentUser.role !== 'manager') {
      throw new ForbiddenException('Only manager can create payOS payment links');
    }

    return this.createPayosLinkForInvoice({
      clinicId: currentUser.clinicId,
      amount: dto.amount,
      description: dto.description,
      orderCode: dto.orderCode,
      invoiceId: dto.invoiceId,
      returnUrl: dto.returnUrl,
      cancelUrl: dto.cancelUrl,
    });
  }

  async createPayosLinkForInvoice(input: CreatePayosLinkInput) {
    const orderCode = this.normalizeOrderCode(input.orderCode);
    const amount = Math.round(input.amount);
    if (amount < 1000) {
      throw new BadRequestException('payOS amount must be at least 1000 VND');
    }

    if (input.invoiceId) {
      const invoice = await this.prisma.invoice.findFirst({
        where: {
          id: input.invoiceId,
          clinicId: input.clinicId,
        },
      });
      if (!invoice) {
        throw new NotFoundException('Invoice not found for payOS link creation');
      }
    }

    const payosResponse = await this.requestPayosCheckoutLink({
      amount,
      description: input.description,
      orderCode,
      returnUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
    });

    await this.prisma.paymentTransaction.upsert({
      where: { providerRef: orderCode },
      create: {
        clinicId: input.clinicId,
        invoiceId: input.invoiceId,
        provider: 'payos',
        providerRef: orderCode,
        paymentMethod: PaymentMethod.payos,
        amount,
        status: PaymentStatus.unpaid,
        metadata: this.buildPayosMetadata(input.description, payosResponse.raw),
      },
      update: {
        clinicId: input.clinicId,
        invoiceId: input.invoiceId,
        amount,
        status: PaymentStatus.unpaid,
        metadata: this.buildPayosMetadata(input.description, payosResponse.raw),
      },
    });

    return {
      provider: 'payos',
      orderCode,
      amount,
      checkoutUrl: payosResponse.checkoutUrl,
      qrCode: payosResponse.qrCode ?? null,
      metadata: payosResponse.data,
    };
  }

  async handlePayosWebhook(rawPayload: Record<string, unknown>) {
    const dto = this.normalizeWebhookPayload(rawPayload);
    if (this.isWebhookConnectivityProbe(dto)) {
      return {
        success: true,
        acknowledged: true,
        probe: true,
      };
    }

    const payload = this.extractWebhookPayload(dto);
    if (!payload) {
      return {
        success: true,
        ignored: true,
        reason: 'invalid_payload',
      };
    }

    const txn = await this.prisma.paymentTransaction.findUnique({
      where: { providerRef: payload.orderCode },
      include: {
        invoice: true,
      },
    });

    if (!txn) {
      return {
        success: true,
        ignored: true,
        reason: 'payment_transaction_not_found',
        orderCode: payload.orderCode,
      };
    }

    this.verifyWebhookSignature(dto);

    const expectedAmount = Math.round(Number(txn.amount ?? 0));
    if (expectedAmount > 0 && Math.round(payload.amount) !== expectedAmount) {
      throw new BadRequestException('Webhook amount mismatch');
    }

    const paid = payload.status.toUpperCase() === 'PAID' || payload.status.toUpperCase() === 'SUCCESS';
    const now = new Date();

    if (paid && txn.status === PaymentStatus.paid) {
      return {
        success: true,
        transactionId: txn.id,
        status: txn.status,
        idempotent: true,
      };
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedTxn = await tx.paymentTransaction.update({
        where: { id: txn.id },
        data: {
          status: paid ? PaymentStatus.paid : PaymentStatus.unpaid,
          paidAt: paid ? now : null,
          metadata: {
            ...(typeof txn.metadata === 'object' && txn.metadata ? txn.metadata : {}),
            webhook: this.toJsonObject(rawPayload),
          } as Prisma.JsonObject,
        },
      });

      if (paid && txn.invoiceId) {
        const invoice = await tx.invoice.update({
          where: { id: txn.invoiceId },
          data: {
            paymentStatus: PaymentStatus.paid,
          },
          include: {
            appointment: true,
          },
        });

        if (invoice.appointmentId) {
          await tx.appointment.update({
            where: { id: invoice.appointmentId },
            data: {
              paymentStatus: PaymentStatus.paid,
              paidAt: now,
            },
          });
        }

        await tx.customer.update({
          where: { id: invoice.customerId },
          data: {
            totalSpent: { increment: invoice.grandTotal },
            totalVisits: { increment: 1 },
            lastVisitAt: now,
          },
        });
      } else if (paid) {
        await tx.subscription.upsert({
          where: { clinicId: txn.clinicId },
          create: {
            clinicId: txn.clinicId,
            planCode: 'premium-monthly',
            planName: 'Premium',
            amount: payload.amount,
            isActive: true,
            startedAt: now,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          update: {
            planCode: 'premium-monthly',
            planName: 'Premium',
            amount: payload.amount,
            isActive: true,
            startedAt: now,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }

      return updatedTxn;
    });

    this.realtimeService.emitSubscriptionUpdated({
      type: paid ? 'payment.paid' : 'payment.unpaid',
      orderCode: payload.orderCode,
      transactionId: updated.id,
    });

    return {
      success: true,
      transactionId: updated.id,
      status: updated.status,
      idempotent: false,
    };
  }

  private async requestPayosCheckoutLink(input: {
    amount: number;
    description: string;
    orderCode: string;
    returnUrl?: string;
    cancelUrl?: string;
  }) {
    const clientId = process.env.PAYOS_CLIENT_ID?.trim();
    const apiKey = process.env.PAYOS_API_KEY?.trim();
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY?.trim();
    if (!clientId || !apiKey || !checksumKey) {
      throw new BadRequestException(
        'Missing payOS credentials. Set PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY.',
      );
    }

    const frontendBaseUrl = this.resolveFrontendBaseUrl();
    const returnUrl = this.resolveRedirectUrl(
      input.returnUrl,
      process.env.PAYOS_RETURN_URL,
      `${frontendBaseUrl}/manager/pos?payment=success`,
    );
    const cancelUrl = this.resolveRedirectUrl(
      input.cancelUrl,
      process.env.PAYOS_CANCEL_URL,
      `${frontendBaseUrl}/manager/pos?payment=cancel`,
    );

    const requestBody = {
      orderCode: Number(input.orderCode),
      amount: input.amount,
      description: input.description.slice(0, 25),
      returnUrl,
      cancelUrl,
    };

    const signature = this.signPayload(requestBody, checksumKey);
    const payload = {
      ...requestBody,
      signature,
    };

    const response = await axios.post('https://api-merchant.payos.vn/v2/payment-requests', payload, {
      headers: {
        'x-client-id': clientId,
        'x-api-key': apiKey,
      },
      timeout: 20000,
    });

    const raw = response.data as Record<string, unknown>;
    const data = (raw.data ?? {}) as Record<string, unknown>;
    const checkoutUrl = String(data.checkoutUrl ?? data.checkout_url ?? '');
    if (!checkoutUrl) {
      throw new BadRequestException('payOS create-link response missing checkoutUrl');
    }

    return {
      checkoutUrl,
      qrCode: typeof data.qrCode === 'string' ? data.qrCode : null,
      data,
      raw,
    };
  }

  private verifyWebhookSignature(dto: NormalizedWebhookPayload) {
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY?.trim();
    const providedSignature = dto.signature?.trim();
    if (!checksumKey || !providedSignature) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const targetData =
      dto.data && Object.keys(dto.data).length > 0
        ? dto.data
        : {
            orderCode: dto.orderCode,
            amount: dto.amount,
            status: dto.status,
          };

    const expected = this.signPayload(targetData as Record<string, unknown>, checksumKey);
    const expectedBuffer = Buffer.from(expected, 'utf8');
    const providedBuffer = Buffer.from(providedSignature, 'utf8');

    if (
      expectedBuffer.length !== providedBuffer.length ||
      !timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      throw new BadRequestException('Webhook signature verification failed');
    }
  }

  private extractWebhookPayload(dto: NormalizedWebhookPayload):
    | {
        orderCode: string;
        status: string;
        amount: number;
      }
    | null {
    const rawOrderCode = this.getWebhookField(dto, 'orderCode') ?? '';
    const rawStatus = this.getWebhookField(dto, 'status') ?? '';
    const rawAmount = this.getWebhookField(dto, 'amount') ?? 0;

    const orderCode = `${rawOrderCode}`.trim();
    const status = `${rawStatus}`.trim();
    const amount = Number(rawAmount);

    if (!orderCode || !status || !Number.isFinite(amount) || amount <= 0) {
      return null;
    }

    return { orderCode, status, amount };
  }

  private isWebhookConnectivityProbe(dto: NormalizedWebhookPayload): boolean {
    const rawOrderCode = this.getWebhookField(dto, 'orderCode') ?? '';
    const rawStatus = this.getWebhookField(dto, 'status') ?? '';
    const rawAmount = this.getWebhookField(dto, 'amount') ?? 0;

    const orderCode = `${rawOrderCode}`.trim();
    const status = `${rawStatus}`.trim();
    const amount = Number(rawAmount);

    return !orderCode && !status && (!Number.isFinite(amount) || amount <= 0);
  }

  private signPayload(data: Record<string, unknown>, checksumKey: string): string {
    const payload = Object.keys(data)
      .sort()
      .map((key) => `${key}=${this.toSignatureValue(data[key])}`)
      .join('&');

    return createHmac('sha256', checksumKey).update(payload).digest('hex');
  }

  private buildPayosMetadata(description: string, raw: Record<string, unknown>): Prisma.JsonObject {
    return {
      description,
      payos: this.toJsonObject(raw),
    };
  }

  private toJsonObject(value: unknown): Prisma.JsonObject {
    return JSON.parse(JSON.stringify(value ?? {})) as Prisma.JsonObject;
  }

  private toSignatureValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  private generateOrderCode(): string {
    return `${Date.now()}`;
  }

  private normalizeOrderCode(candidate?: string): string {
    const raw = candidate?.trim();
    if (!raw) {
      return this.generateOrderCode();
    }
    const digits = raw.replace(/\D/g, '');
    return digits.length > 0 ? digits.slice(0, 18) : this.generateOrderCode();
  }

  private resolveFrontendBaseUrl(): string {
    const explicit = process.env.FRONTEND_URL?.trim();
    if (explicit && /^https?:\/\//i.test(explicit)) {
      return explicit.replace(/\/+$/, '');
    }

    const corsOrigin = process.env.CORS_ORIGIN?.trim();
    if (corsOrigin) {
      const firstOrigin = corsOrigin
        .split(',')
        .map((origin) => origin.trim())
        .find((origin) => /^https?:\/\//i.test(origin));
      if (firstOrigin) {
        return firstOrigin.replace(/\/+$/, '');
      }
    }

    return 'http://140.245.119.189';
  }

  private resolveRedirectUrl(primary: string | undefined, secondary: string | undefined, fallback: string): string {
    return (
      this.sanitizeAbsoluteHttpUrl(primary) ||
      this.sanitizeAbsoluteHttpUrl(secondary) ||
      fallback
    );
  }

  private sanitizeAbsoluteHttpUrl(value?: string): string | null {
    const raw = value?.trim();
    if (!raw) {
      return null;
    }

    try {
      const parsed = new URL(raw);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return null;
      }
      return parsed.toString();
    } catch {
      return null;
    }
  }

  private normalizeWebhookPayload(rawPayload: Record<string, unknown>): NormalizedWebhookPayload {
    const data = this.asRecord(rawPayload.data);
    const successValue = rawPayload.success;

    return {
      orderCode: this.coerceString(rawPayload.orderCode),
      status: this.coerceString(rawPayload.status),
      amount: this.coerceNumber(rawPayload.amount),
      signature: this.coerceString(rawPayload.signature),
      code: this.coerceString(rawPayload.code),
      desc: this.coerceString(rawPayload.desc),
      success:
        typeof successValue === 'boolean'
          ? successValue
          : typeof successValue === 'string'
            ? successValue.toLowerCase() === 'true'
            : undefined,
      data,
    };
  }

  private getWebhookField(dto: NormalizedWebhookPayload, field: string): unknown {
    if (dto.data && field in dto.data) {
      return dto.data[field];
    }
    return (dto as Record<string, unknown>)[field];
  }

  private asRecord(value: unknown): Record<string, unknown> | undefined {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return undefined;
  }

  private coerceString(value: unknown): string | undefined {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return undefined;
  }

  private coerceNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return undefined;
  }
}
