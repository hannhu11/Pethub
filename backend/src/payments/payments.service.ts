import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { NotificationTarget, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
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
  private readonly logger = new Logger(PaymentsService.name);
  private readonly syncCooldownMs = Number(process.env.PAYOS_SYNC_COOLDOWN_MS ?? 3000);
  private readonly lastClinicSyncAt = new Map<string, number>();
  private backgroundSyncRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeService: RealtimeService,
  ) {}

  @Cron('*/20 * * * * *')
  async backgroundSyncPendingPayosTransactions() {
    if (!this.isBackgroundSyncEnabled()) {
      return;
    }

    if (this.backgroundSyncRunning || !this.canCallPayosStatusApi()) {
      return;
    }

    this.backgroundSyncRunning = true;
    try {
      const clinics = await this.prisma.paymentTransaction.findMany({
        where: {
          status: PaymentStatus.unpaid,
          providerRef: { not: null },
          OR: [
            { provider: 'payos' },
            { paymentMethod: PaymentMethod.payos },
            { paymentMethod: PaymentMethod.transfer },
          ],
        },
        distinct: ['clinicId'],
        select: { clinicId: true },
        take: 100,
      });

      for (const clinic of clinics) {
        try {
          await this.syncPendingPayosTransactions(clinic.clinicId, 40, { force: true });
        } catch (error) {
          this.logger.warn(
            `Background payOS sync failed for clinic=${clinic.clinicId}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }
    } finally {
      this.backgroundSyncRunning = false;
    }
  }

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

  async handlePayosWebhook(rawPayload: unknown, signatureHeader?: string) {
    const payloadRecord = this.toPayloadRecord(rawPayload);
    const dto = this.normalizeWebhookPayload(payloadRecord, signatureHeader);
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

    const signatureValid = this.verifyWebhookSignature(dto);
    const expectedAmount = Math.round(Number(txn.amount ?? 0));
    let resolvedAmount = payload.amount;
    let paid = this.resolvePaidState(payload.status, dto);

    if (!signatureValid) {
      const payosStatus = await this.requestPayosPaymentStatus(payload.orderCode);
      if (!payosStatus) {
        return {
          success: true,
          ignored: true,
          reason: 'invalid_signature',
          orderCode: payload.orderCode,
        };
      }

      const normalizedPayosStatus: NormalizedWebhookPayload = {
        orderCode: payload.orderCode,
        status: payosStatus.status,
        amount: payosStatus.amount,
        code: payosStatus.code,
        desc: payosStatus.desc,
        success: payosStatus.success,
        data: payosStatus.data,
      };

      paid = this.resolvePaidState(payosStatus.status ?? '', normalizedPayosStatus);
      resolvedAmount = payosStatus.amount;
      if (!paid) {
        return {
          success: true,
          ignored: true,
          reason: 'invalid_signature',
          orderCode: payload.orderCode,
        };
      }

      this.logger.warn(
        `Accepted payOS webhook with invalid signature after status verification. orderCode=${payload.orderCode}`,
      );
    }

    const webhookAmount = Math.round(resolvedAmount);
    if (expectedAmount > 0 && Math.abs(webhookAmount - expectedAmount) > 1) {
      return {
        success: true,
        ignored: true,
        reason: 'amount_mismatch',
        orderCode: payload.orderCode,
      };
    }
    const now = new Date();

    if (txn.status === PaymentStatus.paid) {
      await this.syncPaidInvoiceState({
        clinicId: txn.clinicId,
        invoiceId: txn.invoiceId,
        paidAt: now,
      });
      await this.emitInvoicePaymentUpdated(txn.clinicId, txn.invoiceId, PaymentStatus.paid, now, payload.orderCode);
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
            webhook: this.toJsonObject(payloadRecord),
            signatureVerified: signatureValid,
          } as Prisma.JsonObject,
        },
      });

      if (paid && txn.invoiceId) {
        await this.syncPaidInvoiceStateTx(tx, {
          clinicId: txn.clinicId,
          invoiceId: txn.invoiceId,
          paidAt: now,
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
      clinicId: txn.clinicId,
      orderCode: payload.orderCode,
      transactionId: updated.id,
    });
    await this.emitInvoicePaymentUpdated(
      txn.clinicId,
      txn.invoiceId,
      paid ? PaymentStatus.paid : PaymentStatus.unpaid,
      paid ? now : null,
      payload.orderCode,
    );
    this.emitPaymentDomainEvents(txn.clinicId, payload.orderCode, paid);

    return {
      success: true,
      transactionId: updated.id,
      status: updated.status,
      idempotent: false,
    };
  }

  async syncInvoicePaymentStatusIfNeeded(clinicId: string, invoiceId: string) {
    const txn = await this.prisma.paymentTransaction.findFirst({
      where: {
        clinicId,
        invoiceId,
        status: PaymentStatus.unpaid,
        providerRef: { not: null },
        OR: [
          { provider: 'payos' },
          { paymentMethod: PaymentMethod.payos },
          { paymentMethod: PaymentMethod.transfer },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!txn?.id) {
      return;
    }

    await this.syncTransactionStatusFromPayos(txn.id);
  }

  async syncPendingPayosTransactions(
    clinicId: string,
    limit = 8,
    options?: { force?: boolean },
  ) {
    if (!this.shouldRunClinicSync(clinicId, Boolean(options?.force))) {
      await this.reconcilePaidTransactionStates(clinicId, Math.max(20, limit * 8));
      await this.reconcileAppointmentPaymentStatus(clinicId, Math.max(20, limit * 6));
      return;
    }

    const txns = await this.prisma.paymentTransaction.findMany({
      where: {
        clinicId,
        status: PaymentStatus.unpaid,
        providerRef: { not: null },
        OR: [
          { provider: 'payos' },
          { paymentMethod: PaymentMethod.payos },
          { paymentMethod: PaymentMethod.transfer },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: Math.max(1, Math.min(limit, 50)),
      select: { id: true },
    });

    for (const txn of txns) {
      await this.syncTransactionStatusFromPayos(txn.id);
    }

    await this.reconcilePaidTransactionStates(clinicId, Math.max(20, limit * 8));
    await this.reconcileAppointmentPaymentStatus(clinicId, Math.max(20, limit * 6));
  }

  private async reconcilePaidTransactionStates(clinicId: string, limit = 120) {
    const paidTransactions = await this.prisma.paymentTransaction.findMany({
      where: {
        clinicId,
        status: PaymentStatus.paid,
        invoiceId: { not: null },
      },
      orderBy: [{ paidAt: 'desc' }, { updatedAt: 'desc' }],
      take: Math.max(10, Math.min(limit, 500)),
      select: {
        invoiceId: true,
        paidAt: true,
      },
    });

    for (const txn of paidTransactions) {
      if (!txn.invoiceId) {
        continue;
      }

      await this.syncPaidInvoiceState({
        clinicId,
        invoiceId: txn.invoiceId,
        paidAt: txn.paidAt ?? new Date(),
      });
    }
  }

  async reconcileAppointmentPaymentStatus(clinicId: string, limit = 120) {
    const paidInvoices = await this.prisma.invoice.findMany({
      where: {
        clinicId,
        paymentStatus: PaymentStatus.paid,
        appointmentId: { not: null },
      },
      orderBy: { updatedAt: 'desc' },
      take: Math.max(10, Math.min(limit, 500)),
      select: {
        appointmentId: true,
        updatedAt: true,
        issuedAt: true,
        appointment: {
          select: {
            id: true,
            paymentStatus: true,
            paidAt: true,
          },
        },
      },
    });

    for (const invoice of paidInvoices) {
      const appointmentId = invoice.appointmentId;
      if (!appointmentId || !invoice.appointment) {
        continue;
      }

      if (
        invoice.appointment.paymentStatus === PaymentStatus.paid &&
        invoice.appointment.paidAt
      ) {
        continue;
      }

      const paidAt = invoice.appointment.paidAt ?? invoice.updatedAt ?? invoice.issuedAt ?? new Date();

      await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          paymentStatus: PaymentStatus.paid,
          paidAt,
        },
      });

      this.realtimeService.emitAppointmentUpdated({
        type: 'payment.reconciled',
        clinicId,
        appointmentId,
      });
    }
  }

  private async syncTransactionStatusFromPayos(txnId: string) {
    const txn = await this.prisma.paymentTransaction.findUnique({
      where: { id: txnId },
      include: {
        invoice: {
          include: {
            appointment: true,
          },
        },
      },
    });

    if (!txn) {
      return;
    }

    if (txn.status === PaymentStatus.paid) {
      await this.syncPaidInvoiceState({
        clinicId: txn.clinicId,
        invoiceId: txn.invoiceId,
        paidAt: txn.paidAt ?? new Date(),
      });
      await this.emitInvoicePaymentUpdated(
        txn.clinicId,
        txn.invoiceId,
        PaymentStatus.paid,
        txn.paidAt ?? new Date(),
        txn.providerRef,
      );
      return;
    }

    const orderCode = txn.providerRef?.trim();
    if (!orderCode) {
      return;
    }

    const payosStatus = await this.requestPayosPaymentStatus(orderCode);
    if (!payosStatus) {
      return;
    }

    const normalizedPayload: NormalizedWebhookPayload = {
      orderCode,
      status: payosStatus.status,
      amount: payosStatus.amount,
      code: payosStatus.code,
      desc: payosStatus.desc,
      success: payosStatus.success,
      data: payosStatus.data,
    };

    const paid = this.resolvePaidState(payosStatus.status ?? '', normalizedPayload);
    if (!paid) {
      return;
    }

    const expectedAmount = Math.round(Number(txn.amount ?? 0));
    const payosAmount = Math.round(payosStatus.amount);
    if (expectedAmount > 0 && Math.abs(payosAmount - expectedAmount) > 1) {
      this.logger.warn(
        `Skipped payOS sync due to amount mismatch. orderCode=${orderCode} expected=${expectedAmount} actual=${Math.round(
          payosStatus.amount,
        )}`,
      );
      return;
    }

    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      const currentTxn = await tx.paymentTransaction.findUnique({
        where: { id: txn.id },
      });

      if (!currentTxn) {
        return null;
      }

      if (currentTxn.status === PaymentStatus.paid) {
        await this.syncPaidInvoiceStateTx(tx, {
          clinicId: txn.clinicId,
          invoiceId: currentTxn.invoiceId,
          paidAt: currentTxn.paidAt ?? now,
        });
        return currentTxn;
      }

      const updatedTxn = await tx.paymentTransaction.update({
        where: { id: txn.id },
        data: {
          status: PaymentStatus.paid,
          paidAt: now,
          metadata: {
            ...(typeof currentTxn.metadata === 'object' && currentTxn.metadata ? currentTxn.metadata : {}),
            payosStatus: this.toJsonObject(payosStatus.raw),
          } as Prisma.JsonObject,
        },
      });

      if (updatedTxn.invoiceId) {
        await this.syncPaidInvoiceStateTx(tx, {
          clinicId: txn.clinicId,
          invoiceId: updatedTxn.invoiceId,
          paidAt: now,
        });
      }

      return updatedTxn;
    });

    if (!updated) {
      return;
    }

    this.realtimeService.emitSubscriptionUpdated({
      type: 'payment.paid',
      clinicId: txn.clinicId,
      orderCode,
      transactionId: updated.id,
    });
    await this.emitInvoicePaymentUpdated(txn.clinicId, updated.invoiceId, PaymentStatus.paid, now, orderCode);
    this.emitPaymentDomainEvents(txn.clinicId, orderCode, true);
  }

  private async requestPayosPaymentStatus(orderCode: string): Promise<{
    status: string;
    amount: number;
    code?: string;
    desc?: string;
    success?: boolean;
    data?: Record<string, unknown>;
    raw: Record<string, unknown>;
  } | null> {
    const clientId = process.env.PAYOS_CLIENT_ID?.trim();
    const apiKey = process.env.PAYOS_API_KEY?.trim();
    if (!clientId || !apiKey) {
      return null;
    }

    try {
      const response = await axios.get(
        `https://api-merchant.payos.vn/v2/payment-requests/${encodeURIComponent(orderCode)}`,
        {
          headers: {
            'x-client-id': clientId,
            'x-api-key': apiKey,
          },
          timeout: 12000,
        },
      );

      const raw = this.toJsonObject(response.data ?? {});
      const data = this.asRecord((response.data as Record<string, unknown> | undefined)?.data) ?? {};
      const status = this.coerceString(data.status) || '';
      const amount =
        this.coerceNumber(data.amount) ??
        this.coerceNumber((response.data as Record<string, unknown> | undefined)?.amount) ??
        0;

      return {
        status,
        amount,
        code:
          this.coerceString(data.code) ||
          this.coerceString((response.data as Record<string, unknown> | undefined)?.code),
        desc:
          this.coerceString(data.desc) ||
          this.coerceString((response.data as Record<string, unknown> | undefined)?.desc),
        success:
          typeof data.success === 'boolean'
            ? data.success
            : typeof (response.data as Record<string, unknown> | undefined)?.success === 'boolean'
              ? Boolean((response.data as Record<string, unknown>).success)
              : undefined,
        data,
        raw,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        if (statusCode === 404) {
          return null;
        }
      }
      this.logger.warn(
        `payOS status check failed for orderCode=${orderCode}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
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

  private verifyWebhookSignature(dto: NormalizedWebhookPayload): boolean {
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY?.trim();
    const providedSignature = dto.signature?.trim();
    if (!checksumKey || !providedSignature) {
      return false;
    }

    const targetData =
      dto.data && Object.keys(dto.data).length > 0
        ? { ...dto.data }
        : {
            orderCode: dto.orderCode,
            amount: dto.amount,
            status: dto.status,
          };
    delete (targetData as Record<string, unknown>).signature;
    delete (targetData as Record<string, unknown>).sign;

    const providedBuffer = Buffer.from(providedSignature, 'utf8');
    const signatureCandidates = this.buildSignatureCandidates(targetData as Record<string, unknown>);

    const valid = signatureCandidates.some((candidate) => {
      const expected = this.signPayload(candidate, checksumKey);
      const expectedBuffer = Buffer.from(expected, 'utf8');
      if (expectedBuffer.length !== providedBuffer.length) {
        return false;
      }
      return timingSafeEqual(expectedBuffer, providedBuffer);
    });

    return valid;
  }

  private extractWebhookPayload(dto: NormalizedWebhookPayload):
    | {
        orderCode: string;
        status: string;
        amount: number;
      }
    | null {
    const rawOrderCode = this.getWebhookField(dto, 'orderCode') ?? '';
    const rawStatus =
      this.getWebhookField(dto, 'status') ??
      this.getWebhookField(dto, 'code') ??
      '';
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

    return 'https://pethubvn.store';
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

  private normalizeWebhookPayload(
    rawPayload: Record<string, unknown>,
    signatureHeader?: string,
  ): NormalizedWebhookPayload {
    const data = this.asRecord(rawPayload.data);
    const successValue = rawPayload.success;
    const signatureFromBody = this.coerceString(rawPayload.signature)?.trim();

    return {
      orderCode: this.coerceString(rawPayload.orderCode),
      status: this.coerceString(rawPayload.status),
      amount: this.coerceNumber(rawPayload.amount),
      signature: signatureFromBody || signatureHeader?.trim(),
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

  private toPayloadRecord(rawPayload: unknown): Record<string, unknown> {
    if (rawPayload && typeof rawPayload === 'object' && !Array.isArray(rawPayload)) {
      return rawPayload as Record<string, unknown>;
    }

    if (typeof rawPayload === 'string') {
      const normalized = rawPayload.trim();
      if (normalized) {
        try {
          const parsed = JSON.parse(normalized);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed as Record<string, unknown>;
          }
        } catch {
          // keep fallback record
        }
      }

      return { raw: rawPayload };
    }

    if (typeof rawPayload === 'number' || typeof rawPayload === 'boolean') {
      return { raw: rawPayload };
    }

    return {};
  }

  private resolvePaidState(status: string, dto: NormalizedWebhookPayload): boolean {
    void dto;
    const normalizedStatus = status.trim().toUpperCase();
    if (
      [
        'PAID',
        'SUCCESS',
        'SUCCEEDED',
        'COMPLETED',
        'DONE',
        'APPROVED',
      ].includes(normalizedStatus)
    ) {
      return true;
    }

    return false;
  }

  private buildSignatureCandidates(data: Record<string, unknown>): Record<string, unknown>[] {
    const normalizedEntries = Object.entries(data).filter(([key]) => key !== 'signature' && key !== 'sign');
    const normalized = Object.fromEntries(normalizedEntries);

    const payosPreferredOrder = [
      'id',
      'orderCode',
      'amount',
      'description',
      'accountNumber',
      'reference',
      'transactionDateTime',
      'currency',
      'paymentLinkId',
      'code',
      'desc',
      'status',
      'counterAccountBankId',
      'counterAccountBankName',
      'counterAccountName',
      'counterAccountNumber',
      'virtualAccountName',
      'virtualAccountNumber',
      'cancel',
    ];

    const payosCandidate: Record<string, unknown> = {};
    for (const key of payosPreferredOrder) {
      if (key in normalized) {
        payosCandidate[key] = normalized[key];
      }
    }

    if (Object.keys(payosCandidate).length === 0) {
      return [normalized];
    }

    return [payosCandidate, normalized];
  }

  private async createPaymentNotifications(
    tx: Prisma.TransactionClient,
    clinicId: string,
    customerId: string,
    invoiceNo: string,
    paidAt: Date,
  ) {
    const customer = await tx.customer.findUnique({
      where: { id: customerId },
      select: { userId: true, name: true },
    });

    await tx.notification.create({
      data: {
        clinicId,
        customerId,
        target: NotificationTarget.manager,
        title: 'Thanh toán hoàn tất',
        body: `Hóa đơn #${invoiceNo} đã thanh toán thành công.`,
        linkTo: '/manager/pos',
        read: false,
      },
    });

    if (customer?.userId) {
      await tx.notification.create({
        data: {
          clinicId,
          customerId,
          userId: customer.userId,
          target: NotificationTarget.customer,
          title: 'Đã ghi nhận thanh toán',
          body: `PetHub đã xác nhận hóa đơn #${invoiceNo} lúc ${paidAt.toLocaleTimeString('vi-VN')}.`,
          linkTo: '/customer/appointments',
          read: false,
        },
      });
    }
  }

  private async syncPaidInvoiceState(input: {
    clinicId: string;
    invoiceId: string | null;
    paidAt: Date;
  }) {
    if (!input.invoiceId) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await this.syncPaidInvoiceStateTx(tx, input);
    });
    await this.emitInvoicePaymentUpdated(
      input.clinicId,
      input.invoiceId,
      PaymentStatus.paid,
      input.paidAt,
      null,
    );
  }

  private async syncPaidInvoiceStateTx(
    tx: Prisma.TransactionClient,
    input: {
      clinicId: string;
      invoiceId: string | null;
      paidAt: Date;
    },
  ) {
    if (!input.invoiceId) {
      return;
    }

    const invoice = await tx.invoice.findUnique({
      where: { id: input.invoiceId },
      include: {
        appointment: true,
      },
    });

    if (!invoice) {
      return;
    }

    const wasInvoicePaid = invoice.paymentStatus === PaymentStatus.paid;
    if (!wasInvoicePaid) {
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paymentStatus: PaymentStatus.paid,
        },
      });

      await tx.customer.update({
        where: { id: invoice.customerId },
        data: {
          totalSpent: { increment: invoice.grandTotal },
          totalVisits: { increment: 1 },
          lastVisitAt: input.paidAt,
        },
      });

      await this.createPaymentNotifications(
        tx,
        input.clinicId,
        invoice.customerId,
        invoice.invoiceNo,
        input.paidAt,
      );
    }

    if (invoice.appointmentId && invoice.appointment?.paymentStatus !== PaymentStatus.paid) {
      await tx.appointment.update({
        where: { id: invoice.appointmentId },
        data: {
          paymentStatus: PaymentStatus.paid,
          paidAt: input.paidAt,
        },
      });
    }
  }

  private emitPaymentDomainEvents(clinicId: string, orderCode: string | null, paid: boolean) {
    if (!paid) {
      return;
    }

    this.realtimeService.emitAppointmentUpdated({
      type: 'payment.paid',
      clinicId,
      orderCode: orderCode ?? null,
    });
    this.realtimeService.emitNotificationCreated({
      type: 'payment.paid',
      clinicId,
      orderCode: orderCode ?? null,
    });
  }

  private async emitInvoicePaymentUpdated(
    clinicId: string,
    invoiceId: string | null,
    paymentStatus: PaymentStatus,
    paidAt: Date | null,
    orderCode: string | null,
  ) {
    if (!invoiceId) {
      return;
    }

    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        clinicId,
      },
      select: {
        id: true,
        appointmentId: true,
      },
    });
    if (!invoice) {
      return;
    }

    this.realtimeService.emitInvoicePaymentUpdated({
      clinicId,
      invoiceId: invoice.id,
      appointmentId: invoice.appointmentId,
      paymentStatus,
      paidAt: paidAt?.toISOString() ?? null,
      orderCode,
    });

    if (paymentStatus === PaymentStatus.paid && invoice.appointmentId) {
      this.realtimeService.emitAppointmentUpdated({
        type: 'payment.paid',
        clinicId,
        appointmentId: invoice.appointmentId,
        paidAt: paidAt?.toISOString() ?? null,
      });
    }
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

  private shouldRunClinicSync(clinicId: string, force: boolean): boolean {
    if (force) {
      this.lastClinicSyncAt.set(clinicId, Date.now());
      return true;
    }

    if (!Number.isFinite(this.syncCooldownMs) || this.syncCooldownMs <= 0) {
      return true;
    }

    const now = Date.now();
    const last = this.lastClinicSyncAt.get(clinicId) ?? 0;
    if (now - last < this.syncCooldownMs) {
      return false;
    }
    this.lastClinicSyncAt.set(clinicId, now);
    return true;
  }

  private canCallPayosStatusApi(): boolean {
    const clientId = process.env.PAYOS_CLIENT_ID?.trim();
    const apiKey = process.env.PAYOS_API_KEY?.trim();
    return Boolean(clientId && apiKey);
  }

  private isBackgroundSyncEnabled() {
    return (process.env.PAYOS_BACKGROUND_SYNC_ENABLED ?? 'true').toLowerCase() === 'true';
  }
}
