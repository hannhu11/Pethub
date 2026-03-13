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
import { PayosWebhookDto } from './dto/payos-webhook.dto';
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

  async handlePayosWebhook(dto: PayosWebhookDto) {
    const payload = this.extractWebhookPayload(dto);
    this.verifyWebhookSignature(dto);

    const txn = await this.prisma.paymentTransaction.findUnique({
      where: { providerRef: payload.orderCode },
      include: {
        invoice: true,
      },
    });

    if (!txn) {
      throw new NotFoundException('Payment transaction not found');
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
            webhook: this.toJsonObject(dto),
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

    const returnUrl =
      input.returnUrl?.trim() || process.env.PAYOS_RETURN_URL?.trim() || 'https://pethub.vn/payment/success';
    const cancelUrl =
      input.cancelUrl?.trim() || process.env.PAYOS_CANCEL_URL?.trim() || 'https://pethub.vn/payment/cancel';

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

  private verifyWebhookSignature(dto: PayosWebhookDto) {
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

  private extractWebhookPayload(dto: PayosWebhookDto): {
    orderCode: string;
    status: string;
    amount: number;
  } {
    const orderCode = `${dto.data?.orderCode ?? dto.orderCode ?? ''}`.trim();
    const status = `${dto.data?.status ?? dto.status ?? ''}`.trim();
    const amount = Number(dto.data?.amount ?? dto.amount ?? 0);

    if (!orderCode || !status || !Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Invalid payOS webhook payload');
    }

    return { orderCode, status, amount };
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
}
