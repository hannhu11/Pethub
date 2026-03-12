import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AppointmentStatus,
  InvoiceItemType,
  PaymentStatus,
  Prisma,
  type PaymentMethod,
} from '@prisma/client';
import { createHash } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { PosPrefillQueryDto } from './dto/pos-prefill-query.dto';
import { PosCheckoutDto } from './dto/pos-checkout.dto';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class PosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async getPrefill(query: PosPrefillQueryDto) {
    if (!query.appointmentId) {
      return { appointment: null };
    }

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: query.appointmentId },
      include: {
        customer: true,
        pet: true,
        service: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return {
      appointment,
      suggestedItems: [
        {
          itemType: InvoiceItemType.service,
          serviceId: appointment.serviceId,
          name: appointment.service.name,
          qty: 1,
          unitPrice: Number(appointment.service.price),
        },
      ],
    };
  }

  async checkout(dto: PosCheckoutDto, currentUser: AuthUser) {
    const taxPercent = dto.taxPercent ?? 8;

    const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (dto.appointmentId) {
      const appointment = await this.prisma.appointment.findUnique({ where: { id: dto.appointmentId } });
      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }
      if (appointment.status !== AppointmentStatus.completed) {
        throw new BadRequestException('Only completed appointments can be checked out in POS');
      }
      if (appointment.paymentStatus === PaymentStatus.paid) {
        throw new BadRequestException('Appointment already paid');
      }
    }

    const preparedItems = dto.items.map((item) => {
      const unitPrice = Number(item.unitPrice);
      const total = unitPrice * item.qty;
      return {
        itemType: item.itemType,
        serviceId: item.serviceId,
        productId: item.productId,
        petId: dto.petId,
        name: item.name,
        qty: item.qty,
        unitPrice,
        total,
      };
    });

    const subtotal = preparedItems.reduce((acc, item) => acc + item.total, 0);
    const taxAmount = (subtotal * taxPercent) / 100;
    const grandTotal = subtotal + taxAmount;

    const invoiceNo = this.generateInvoiceNo();

    const data = await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          invoiceNo,
          appointmentId: dto.appointmentId,
          customerId: dto.customerId,
          managerId: currentUser.userId,
          paymentMethod: dto.paymentMethod as PaymentMethod,
          paymentStatus: PaymentStatus.paid,
          subtotal,
          taxPercent,
          taxAmount,
          grandTotal,
          immutableHash: 'temp',
          items: {
            create: preparedItems.map((item) => ({
              itemType: item.itemType,
              serviceId: item.serviceId,
              productId: item.productId,
              petId: item.petId,
              name: item.name,
              qty: item.qty,
              unitPrice: item.unitPrice,
              total: item.total,
            })),
          },
        },
        include: {
          customer: true,
          items: true,
        },
      });

      const immutableHash = this.hashInvoice(invoice.id, invoice.invoiceNo, grandTotal);
      await tx.invoice.update({ where: { id: invoice.id }, data: { immutableHash } });

      if (dto.appointmentId) {
        await tx.appointment.update({
          where: { id: dto.appointmentId },
          data: {
            paymentStatus: PaymentStatus.paid,
            paidAt: new Date(),
          },
        });
      }

      await tx.paymentTransaction.create({
        data: {
          invoiceId: invoice.id,
          provider: 'pos',
          paymentMethod: dto.paymentMethod,
          amount: grandTotal,
          status: PaymentStatus.paid,
          currency: 'VND',
          paidAt: new Date(),
        },
      });

      await tx.customer.update({
        where: { id: dto.customerId },
        data: {
          totalSpent: { increment: grandTotal },
          totalVisits: { increment: 1 },
          lastVisitAt: new Date(),
        },
      });

      for (const item of preparedItems) {
        if (item.itemType === InvoiceItemType.product && item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.qty },
            },
          });
        }
      }

      return invoice;
    });

    this.realtimeService.emitSubscriptionUpdated({
      type: 'invoice.created',
      invoiceId: data.id,
      customerId: data.customerId,
      amount: grandTotal,
    });

    return {
      invoiceId: data.id,
      invoiceNo,
      totals: {
        subtotal,
        taxPercent,
        taxAmount,
        grandTotal,
      },
    };
  }

  private generateInvoiceNo(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const sec = String(now.getSeconds()).padStart(2, '0');

    return `INV-${y}${m}${d}-${h}${min}${sec}`;
  }

  private hashInvoice(id: string, invoiceNo: string, grandTotal: number): string {
    const payload = `${id}:${invoiceNo}:${grandTotal.toFixed(2)}`;
    return createHash('sha256').update(payload).digest('hex');
  }
}
