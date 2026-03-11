import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomerSegment } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CustomersQueryDto } from './dto/customers-query.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: CustomersQueryDto) {
    const customers = await this.prisma.customer.findMany({
      where: query.segment ? { segment: query.segment } : undefined,
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

  async getById(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
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
