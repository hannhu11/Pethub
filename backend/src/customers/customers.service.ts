import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CustomersQueryDto } from './dto/customers-query.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { PaymentsService } from '../payments/payments.service';
import { CustomerTierService } from '../customer-tier/customer-tier.service';
import { UpdateCustomerSegmentSettingsDto } from './dto/update-customer-segment-settings.dto';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
    private readonly customerTierService: CustomerTierService,
  ) {}

  async create(currentUser: AuthUser, dto: CreateCustomerDto) {
    const normalizedName = dto.name.trim();
    const normalizedPhone = dto.phone.trim();
    const normalizedEmail = dto.email?.trim().toLowerCase() || null;

    const existingByPhone = await this.prisma.customer.findFirst({
      where: {
        clinicId: currentUser.clinicId,
        phone: normalizedPhone,
      },
      include: {
        pets: true,
      },
    });
    if (existingByPhone) {
      return existingByPhone;
    }

    if (normalizedEmail) {
      const existingByEmail = await this.prisma.customer.findFirst({
        where: {
          clinicId: currentUser.clinicId,
          email: normalizedEmail,
        },
        include: {
          pets: true,
        },
      });
      if (existingByEmail) {
        return existingByEmail;
      }
    }

    return this.prisma.customer.create({
      data: {
        clinicId: currentUser.clinicId,
        name: normalizedName,
        phone: normalizedPhone,
        email: normalizedEmail,
      },
      include: {
        pets: true,
      },
    });
  }

  async list(currentUser: AuthUser, query: CustomersQueryDto) {
    const customers = await this.prisma.customer.findMany({
      where: {
        clinicId: currentUser.clinicId,
        ...(query.segment ? { segment: query.segment } : {}),
      },
      include: {
        pets: true,
      },
      orderBy: [
        { segment: 'asc' },
        { totalSpent: 'desc' },
      ],
      take: 500,
    });

    return customers;
  }

  async getById(currentUser: AuthUser, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
        clinicId: currentUser.clinicId,
      },
      include: {
        pets: true,
        appointments: {
          include: { service: true, pet: true },
          orderBy: { appointmentAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async getSegmentSettings(currentUser: AuthUser) {
    return this.customerTierService.getSettings(currentUser.clinicId);
  }

  async updateSegmentSettings(currentUser: AuthUser, dto: UpdateCustomerSegmentSettingsDto) {
    if (dto.loyalMinSpent <= dto.regularMinSpent) {
      throw new BadRequestException('Mốc Thân thiết phải lớn hơn mốc Khách thường.');
    }
    if (dto.vipMinSpent <= dto.loyalMinSpent) {
      throw new BadRequestException('Mốc VIP phải lớn hơn mốc Thân thiết.');
    }

    await this.paymentsService.syncPendingPayosTransactions(currentUser.clinicId, 16);

    return this.prisma.$transaction(async (tx) => {
      const before = await this.customerTierService.getSettings(currentUser.clinicId, tx);
      const updated = await (tx as any).customerTierSettings.upsert({
        where: { clinicId: currentUser.clinicId },
        create: {
          clinicId: currentUser.clinicId,
          regularMinSpent: dto.regularMinSpent,
          loyalMinSpent: dto.loyalMinSpent,
          vipMinSpent: dto.vipMinSpent,
        },
        update: {
          regularMinSpent: dto.regularMinSpent,
          loyalMinSpent: dto.loyalMinSpent,
          vipMinSpent: dto.vipMinSpent,
        },
      });

      const nextSettings = {
        newMinSpent: 0,
        regularMinSpent: Number(updated.regularMinSpent),
        loyalMinSpent: Number(updated.loyalMinSpent),
        vipMinSpent: Number(updated.vipMinSpent),
        updatedAt: updated.updatedAt.toISOString(),
      };

      await this.customerTierService.bulkReclassifyCustomers(currentUser.clinicId, tx, nextSettings);

      await tx.auditLog.create({
        data: {
          clinicId: currentUser.clinicId,
          actorId: currentUser.userId,
          action: 'customers.segment-settings.update',
          entityType: 'customer_tier_settings',
          entityId: updated.id,
          before,
          after: nextSettings,
        },
      });

      return nextSettings;
    });
  }
}
