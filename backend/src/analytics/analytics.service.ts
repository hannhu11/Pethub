import { Injectable } from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(currentUser: AuthUser, query: AnalyticsQueryDto) {
    const range = this.resolveDateRange(query);
    const wherePaidInRange: Prisma.InvoiceWhereInput = {
      clinicId: currentUser.clinicId,
      paymentStatus: PaymentStatus.paid,
      issuedAt: range,
    };

    const [customers, paidInvoices, completedUnpaidAppointments, topService] = await Promise.all([
      this.prisma.customer.findMany({
        where: { clinicId: currentUser.clinicId },
        select: {
          id: true,
          totalSpent: true,
        },
      }),
      this.prisma.invoice.aggregate({
        where: wherePaidInRange,
        _sum: { grandTotal: true },
        _count: { _all: true },
      }),
      this.prisma.appointment.count({
        where: {
          clinicId: currentUser.clinicId,
          status: 'completed',
          paymentStatus: 'unpaid',
        },
      }),
      this.prisma.invoiceLineItem.groupBy({
        by: ['serviceId'],
        where: {
          invoice: {
            clinicId: currentUser.clinicId,
            paymentStatus: PaymentStatus.paid,
            issuedAt: range,
          },
          itemType: 'service',
          serviceId: { not: null },
        },
        _sum: { total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 1,
      }),
    ]);

    const totalLtv = customers.reduce((acc, item) => acc + Number(item.totalSpent), 0);
    let topServiceRevenue: { serviceId: string; serviceName: string; revenue: number } | null = null;

    if (topService.length > 0 && topService[0]?.serviceId) {
      const service = await this.prisma.service.findFirst({
        where: {
          id: topService[0].serviceId,
          clinicId: currentUser.clinicId,
        },
        select: { id: true, name: true },
      });

      if (service) {
        topServiceRevenue = {
          serviceId: service.id,
          serviceName: service.name,
          revenue: Number(topService[0]._sum.total ?? 0),
        };
      }
    }

    return {
      range: {
        from: range.gte?.toISOString() ?? null,
        to: range.lte?.toISOString() ?? null,
      },
      totals: {
        totalLtv,
        totalCustomers: customers.length,
        paidRevenue: Number(paidInvoices._sum.grandTotal ?? 0),
        paidInvoices: paidInvoices._count._all,
        completedUnpaidAppointments,
      },
      topServiceRevenue,
    };
  }

  async getCustomerLtvSummary(currentUser: AuthUser) {
    const customers = await this.prisma.customer.findMany({
      where: {
        clinicId: currentUser.clinicId,
      },
      orderBy: [{ totalSpent: 'desc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        segment: true,
        totalSpent: true,
        totalVisits: true,
        lastVisitAt: true,
      },
    });

    const totalLtv = customers.reduce((acc, item) => acc + Number(item.totalSpent), 0);

    return {
      totalLtv,
      totalCustomers: customers.length,
      items: customers,
    };
  }

  private resolveDateRange(query: AnalyticsQueryDto): { gte?: Date; lte?: Date } {
    const range: { gte?: Date; lte?: Date } = {};
    if (query.from) {
      range.gte = new Date(query.from);
    }
    if (query.to) {
      range.lte = new Date(query.to);
    }
    return range;
  }
}
