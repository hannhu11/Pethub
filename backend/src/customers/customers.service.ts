import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomerSegment } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CustomersQueryDto } from './dto/customers-query.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import type { AuthUser } from '../common/interfaces/auth-user.interface';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

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

    const normalized = await Promise.all(
      customers.map(async (customer) => {
        const computedSegment = this.computeSegment(Number(customer.totalSpent));
        if (computedSegment !== customer.segment) {
          await this.prisma.customer.update({
            where: { id: customer.id },
            data: { segment: computedSegment },
          });
        }

        return {
          ...customer,
          segment: computedSegment,
        };
      }),
    );

    return normalized.sort((a, b) => this.segmentRank(a.segment) - this.segmentRank(b.segment));
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

    return {
      ...customer,
      segment: this.computeSegment(Number(customer.totalSpent)),
    };
  }

  private computeSegment(totalSpent: number): CustomerSegment {
    if (totalSpent >= 10_000_000) {
      return CustomerSegment.vip;
    }
    if (totalSpent >= 3_000_000) {
      return CustomerSegment.loyal;
    }
    if (totalSpent >= 1) {
      return CustomerSegment.regular;
    }
    return CustomerSegment.new;
  }

  private segmentRank(segment: CustomerSegment): number {
    const rank: Record<CustomerSegment, number> = {
      vip: 0,
      loyal: 1,
      regular: 2,
      new: 3,
    };
    return rank[segment];
  }
}
