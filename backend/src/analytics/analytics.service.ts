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
    const chartEnd = range.lte ?? new Date();
    const chartStart = this.startOfMonthMonthsAgo(chartEnd, 5);
    const wherePaidInRange: Prisma.InvoiceWhereInput = {
      clinicId: currentUser.clinicId,
      paymentStatus: PaymentStatus.paid,
      issuedAt: range,
    };

    const [customers, paidInvoices, completedUnpaidAppointments, paidInvoicesForChart, groupedServices] = await Promise.all([
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
      this.prisma.invoice.findMany({
        where: {
          clinicId: currentUser.clinicId,
          paymentStatus: PaymentStatus.paid,
          issuedAt: {
            gte: chartStart,
            lte: chartEnd,
          },
        },
        select: {
          issuedAt: true,
          grandTotal: true,
        },
        orderBy: { issuedAt: 'asc' },
      }),
      this.prisma.invoiceLineItem.groupBy({
        by: ['serviceId'],
        where: {
          invoice: {
            clinicId: currentUser.clinicId,
            paymentStatus: PaymentStatus.paid,
            issuedAt: {
              gte: chartStart,
              lte: chartEnd,
            },
          },
          itemType: 'service',
          serviceId: { not: null },
        },
        _sum: { total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 8,
      }),
    ]);

    const totalLtv = customers.reduce((acc, item) => acc + Number(item.totalSpent), 0);
    const monthlyRevenue = this.buildMonthlyRevenueSeries(paidInvoicesForChart, chartEnd);
    const serviceRevenue = await this.buildServiceRevenueSeries(currentUser.clinicId, groupedServices);
    const topServiceRevenue = serviceRevenue[0] ?? null;

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
      monthlyRevenue,
      serviceRevenue,
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

  private startOfMonthMonthsAgo(endDate: Date, monthsAgo: number) {
    return new Date(endDate.getFullYear(), endDate.getMonth() - monthsAgo, 1, 0, 0, 0, 0);
  }

  private buildMonthlyRevenueSeries(
    invoices: Array<{ issuedAt: Date; grandTotal: Prisma.Decimal }>,
    chartEnd: Date,
  ) {
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(chartEnd.getFullYear(), chartEnd.getMonth() - (5 - index), 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return {
        key,
        month: `Th${String(date.getMonth() + 1).padStart(2, '0')}`,
        paidRevenue: 0,
        paidInvoices: 0,
      };
    });

    const monthMap = new Map(months.map((item) => [item.key, item]));

    for (const invoice of invoices) {
      const issuedAt = new Date(invoice.issuedAt);
      const key = `${issuedAt.getFullYear()}-${String(issuedAt.getMonth() + 1).padStart(2, '0')}`;
      const bucket = monthMap.get(key);
      if (!bucket) {
        continue;
      }
      bucket.paidRevenue += Number(invoice.grandTotal ?? 0);
      bucket.paidInvoices += 1;
    }

    return months;
  }

  private async buildServiceRevenueSeries(
    clinicId: string,
    groupedServices: Array<{ serviceId: string | null; _sum: { total: Prisma.Decimal | null } }>,
  ) {
    const serviceIds = groupedServices
      .map((item) => item.serviceId)
      .filter((serviceId): serviceId is string => Boolean(serviceId));

    if (serviceIds.length === 0) {
      return [] as Array<{ serviceId: string; serviceName: string; revenue: number }>;
    }

    const services = await this.prisma.service.findMany({
      where: {
        clinicId,
        id: { in: serviceIds },
      },
      select: {
        id: true,
        name: true,
      },
    });
    const serviceNameMap = new Map(services.map((service) => [service.id, service.name]));

    return groupedServices
      .filter((item): item is { serviceId: string; _sum: { total: Prisma.Decimal | null } } => Boolean(item.serviceId))
      .map((item) => ({
        serviceId: item.serviceId,
        serviceName: serviceNameMap.get(item.serviceId) ?? 'Dịch vụ',
        revenue: Number(item._sum.total ?? 0),
      }));
  }
}
