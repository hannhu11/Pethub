import { Injectable } from '@nestjs/common';
import { CustomerSegment, Prisma } from '@prisma/client';
import { CUSTOMER_SEGMENT_THRESHOLDS } from '../common/constants/domain.constants';
import { PrismaService } from '../database/prisma.service';

type PrismaTx = Prisma.TransactionClient | PrismaService;

export type CustomerTierSettingsView = {
  newMinSpent: number;
  regularMinSpent: number;
  loyalMinSpent: number;
  vipMinSpent: number;
  updatedAt: string | null;
};

@Injectable()
export class CustomerTierService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(clinicId: string, tx: PrismaTx = this.prisma): Promise<CustomerTierSettingsView> {
    // Prisma's generated delegate is present at runtime; narrow locally to avoid cross-module type lag after schema updates.
    const settings = await (tx as any).customerTierSettings.findUnique({
      where: { clinicId },
    });

    return {
      newMinSpent: CUSTOMER_SEGMENT_THRESHOLDS.new,
      regularMinSpent: Number(settings?.regularMinSpent ?? CUSTOMER_SEGMENT_THRESHOLDS.regular),
      loyalMinSpent: Number(settings?.loyalMinSpent ?? CUSTOMER_SEGMENT_THRESHOLDS.loyal),
      vipMinSpent: Number(settings?.vipMinSpent ?? CUSTOMER_SEGMENT_THRESHOLDS.vip),
      updatedAt: settings?.updatedAt?.toISOString() ?? null,
    };
  }

  computeSegment(
    totalSpent: number,
    settings: Pick<CustomerTierSettingsView, 'regularMinSpent' | 'loyalMinSpent' | 'vipMinSpent'>,
  ): CustomerSegment {
    if (totalSpent >= settings.vipMinSpent) {
      return CustomerSegment.vip;
    }
    if (totalSpent >= settings.loyalMinSpent) {
      return CustomerSegment.loyal;
    }
    if (totalSpent >= settings.regularMinSpent) {
      return CustomerSegment.regular;
    }
    return CustomerSegment.new;
  }

  async bulkReclassifyCustomers(
    clinicId: string,
    tx: PrismaTx = this.prisma,
    settingsArg?: CustomerTierSettingsView,
  ): Promise<void> {
    const settings = settingsArg ?? await this.getSettings(clinicId, tx);

    await tx.customer.updateMany({
      where: {
        clinicId,
        totalSpent: { gte: settings.vipMinSpent },
      },
      data: { segment: CustomerSegment.vip },
    });

    await tx.customer.updateMany({
      where: {
        clinicId,
        totalSpent: {
          gte: settings.loyalMinSpent,
          lt: settings.vipMinSpent,
        },
      },
      data: { segment: CustomerSegment.loyal },
    });

    await tx.customer.updateMany({
      where: {
        clinicId,
        totalSpent: {
          gte: settings.regularMinSpent,
          lt: settings.loyalMinSpent,
        },
      },
      data: { segment: CustomerSegment.regular },
    });

    await tx.customer.updateMany({
      where: {
        clinicId,
        totalSpent: { lt: settings.regularMinSpent },
      },
      data: { segment: CustomerSegment.new },
    });
  }

  async syncCustomerSegmentForTotalSpent(
    clinicId: string,
    customer: {
      id: string;
      totalSpent: Prisma.Decimal | number | string;
      segment: CustomerSegment;
    },
    tx: PrismaTx = this.prisma,
  ): Promise<CustomerSegment> {
    const settings = await this.getSettings(clinicId, tx);
    const nextSegment = this.computeSegment(Number(customer.totalSpent), settings);

    if (nextSegment !== customer.segment) {
      await tx.customer.update({
        where: { id: customer.id },
        data: { segment: nextSegment },
      });
    }

    return nextSegment;
  }
}
