import { Injectable } from '@nestjs/common';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreatePayosLinkDto } from './dto/create-payos-link.dto';
import { PayosWebhookDto } from './dto/payos-webhook.dto';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async createPayosLink(dto: CreatePayosLinkDto) {
    const orderCode = dto.orderCode ?? `PO-${Date.now()}`;

    await this.prisma.paymentTransaction.upsert({
      where: { providerRef: orderCode },
      create: {
        provider: 'payos',
        providerRef: orderCode,
        paymentMethod: PaymentMethod.payos,
        amount: dto.amount,
        status: PaymentStatus.unpaid,
        metadata: {
          description: dto.description,
        },
      },
      update: {
        amount: dto.amount,
        status: PaymentStatus.unpaid,
        metadata: {
          description: dto.description,
        },
      },
    });

    return {
      provider: 'payos',
      orderCode,
      amount: dto.amount,
      qrPayload: {
        bank: 'Vietcombank',
        account: '190020268888',
        owner: 'PETHUB SOFTWARE',
        memo: orderCode,
      },
      checkoutUrl: `https://payos.vn/checkout/${orderCode}`,
    };
  }

  async handlePayosWebhook(dto: PayosWebhookDto) {
    const paid = dto.status.toUpperCase() === 'PAID';

    const txn = await this.prisma.paymentTransaction.update({
      where: { providerRef: dto.orderCode },
      data: {
        status: paid ? PaymentStatus.paid : PaymentStatus.unpaid,
        paidAt: paid ? new Date() : null,
        metadata: {
          amount: dto.amount,
          status: dto.status,
          signature: dto.signature,
        },
      },
    });

    if (paid) {
      const clinic = await this.prisma.clinicSettings.findFirst({ orderBy: { createdAt: 'asc' } });
      const clinicId = clinic?.id ?? 'default-clinic';

      await this.prisma.subscription.upsert({
        where: { clinicId },
        create: {
          clinicId,
          planCode: 'premium-monthly',
          planName: 'Premium',
          amount: dto.amount,
          isActive: true,
          startedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        update: {
          planCode: 'premium-monthly',
          planName: 'Premium',
          amount: dto.amount,
          isActive: true,
          startedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      this.realtimeService.emitSubscriptionUpdated({
        type: 'premium.activated',
        orderCode: dto.orderCode,
      });
    }

    return {
      success: true,
      transactionId: txn.id,
      status: txn.status,
    };
  }
}
