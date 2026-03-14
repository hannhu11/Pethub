import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus, InvoiceItemType, PaymentMethod, PaymentStatus } from '@prisma/client';
import { createHash } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { PosPrefillQueryDto } from './dto/pos-prefill-query.dto';
import { PosCheckoutDto } from './dto/pos-checkout.dto';
import { RealtimeService } from '../realtime/realtime.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class PosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeService: RealtimeService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async getPrefill(currentUser: AuthUser, query: PosPrefillQueryDto) {
    if (!query.appointmentId) {
      return { appointment: null };
    }

    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: query.appointmentId,
        clinicId: currentUser.clinicId,
      },
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
    const instantPayment = this.isInstantPayment(dto.paymentMethod);

    const customer = await this.prisma.customer.findFirst({
      where: {
        id: dto.customerId,
        clinicId: currentUser.clinicId,
      },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const appointment = await this.resolveAppointmentContext(dto, currentUser);
    const appointmentId = appointment?.id ?? dto.appointmentId;
    if (appointmentId) {
      const existingInvoice = await this.prisma.invoice.findFirst({
        where: {
          clinicId: currentUser.clinicId,
          appointmentId,
        },
      });
      if (existingInvoice) {
        if (existingInvoice.paymentStatus === PaymentStatus.paid) {
          return {
            invoiceId: existingInvoice.id,
            invoiceNo: existingInvoice.invoiceNo,
            paymentStatus: 'paid' as const,
            paymentAction: null,
            totals: {
              subtotal: Number(existingInvoice.subtotal),
              taxPercent: Number(existingInvoice.taxPercent),
              taxAmount: Number(existingInvoice.taxAmount),
              grandTotal: Number(existingInvoice.grandTotal),
            },
          };
        }

        if (instantPayment) {
          throw new BadRequestException(
            'Lịch hẹn này đã có hóa đơn chờ thanh toán. Vui lòng thanh toán hóa đơn hiện có trên trang Trạng thái giao dịch.',
          );
        }

        const paymentAction = await this.paymentsService.createPayosLinkForInvoice({
          clinicId: currentUser.clinicId,
          invoiceId: existingInvoice.id,
          amount: Number(existingInvoice.grandTotal),
          description: `Thanh toan hoa don ${existingInvoice.invoiceNo}`,
          returnUrl: dto.returnUrl,
          cancelUrl: dto.cancelUrl,
        });

        return {
          invoiceId: existingInvoice.id,
          invoiceNo: existingInvoice.invoiceNo,
          paymentStatus: existingInvoice.paymentStatus as 'unpaid' | 'paid' | 'refunded',
          paymentAction,
          totals: {
            subtotal: Number(existingInvoice.subtotal),
            taxPercent: Number(existingInvoice.taxPercent),
            taxAmount: Number(existingInvoice.taxAmount),
            grandTotal: Number(existingInvoice.grandTotal),
          },
        };
      }
    }

    const effectivePetId = appointment?.petId ?? dto.petId;
    if (effectivePetId) {
      const pet = await this.prisma.pet.findFirst({
        where: {
          id: effectivePetId,
          clinicId: currentUser.clinicId,
          customerId: customer.id,
        },
      });
      if (!pet) {
        throw new BadRequestException('Pet does not belong to the selected customer');
      }
    }

    const preparedItems = dto.items.map((item) => {
      const unitPrice = Number(item.unitPrice);
      const total = unitPrice * item.qty;
      return {
        itemType: item.itemType,
        serviceId: item.serviceId,
        productId: item.productId,
        petId: effectivePetId,
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
    const pendingOrderCode = instantPayment ? null : `${Date.now()}`;

    const paymentStatus = instantPayment ? PaymentStatus.paid : PaymentStatus.unpaid;
    const now = new Date();

    const data = await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          clinicId: currentUser.clinicId,
          invoiceNo,
          appointmentId: appointmentId || undefined,
          customerId: customer.id,
          managerId: currentUser.userId,
          paymentMethod: dto.paymentMethod as PaymentMethod,
          paymentStatus,
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

      await tx.paymentTransaction.create({
        data: {
          clinicId: currentUser.clinicId,
          invoiceId: invoice.id,
          provider: this.resolvePaymentProvider(dto.paymentMethod),
          providerRef: instantPayment ? `POS-${invoice.invoiceNo}` : pendingOrderCode,
          paymentMethod: dto.paymentMethod,
          amount: grandTotal,
          status: paymentStatus,
          currency: 'VND',
          paidAt: instantPayment ? now : null,
        },
      });

      if (appointmentId && instantPayment) {
        await tx.appointment.update({
          where: { id: appointmentId },
          data: {
            paymentStatus: PaymentStatus.paid,
            paidAt: now,
          },
        });
      }

      if (instantPayment) {
        await tx.customer.update({
          where: { id: customer.id },
          data: {
            totalSpent: { increment: grandTotal },
            totalVisits: { increment: 1 },
            lastVisitAt: now,
          },
        });
      }

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

    const paymentAction = instantPayment
      ? null
      : await this.paymentsService.createPayosLinkForInvoice({
          clinicId: currentUser.clinicId,
          invoiceId: data.id,
          amount: grandTotal,
          orderCode: pendingOrderCode ?? undefined,
          description: `Thanh toan hoa don ${data.invoiceNo}`,
          returnUrl: dto.returnUrl,
          cancelUrl: dto.cancelUrl,
        });

    this.realtimeService.emitSubscriptionUpdated({
      type: 'invoice.created',
      clinicId: currentUser.clinicId,
      invoiceId: data.id,
      customerId: data.customerId,
      amount: grandTotal,
      paymentStatus,
    });

    return {
      invoiceId: data.id,
      invoiceNo,
      paymentStatus,
      paymentAction,
      totals: {
        subtotal,
        taxPercent,
        taxAmount,
        grandTotal,
      },
    };
  }

  private async resolveAppointmentContext(dto: PosCheckoutDto, currentUser: AuthUser) {
    const serviceIds = Array.from(
      new Set(
        dto.items
          .filter((item) => item.itemType === InvoiceItemType.service && item.serviceId)
          .map((item) => item.serviceId as string),
      ),
    );

    if (dto.appointmentId) {
      const appointment = await this.prisma.appointment.findFirst({
        where: {
          id: dto.appointmentId,
          clinicId: currentUser.clinicId,
        },
      });
      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }
      if (appointment.status !== AppointmentStatus.completed) {
        throw new BadRequestException('Only completed appointments can be checked out in POS');
      }
      if (appointment.paymentStatus === PaymentStatus.paid) {
        throw new BadRequestException('Appointment already paid');
      }
      if (appointment.customerId !== dto.customerId) {
        throw new BadRequestException('appointmentId does not match selected customer');
      }
      if (dto.petId && appointment.petId !== dto.petId) {
        throw new BadRequestException('appointmentId does not match selected pet');
      }
      if (serviceIds.length > 0 && !serviceIds.includes(appointment.serviceId)) {
        throw new BadRequestException('appointmentId does not match selected service in cart');
      }
      return appointment;
    }

    if (!dto.petId || serviceIds.length === 0) {
      return null;
    }

    const candidates = await this.prisma.appointment.findMany({
      where: {
        clinicId: currentUser.clinicId,
        customerId: dto.customerId,
        petId: dto.petId,
        status: AppointmentStatus.completed,
        paymentStatus: PaymentStatus.unpaid,
        serviceId: { in: serviceIds },
      },
      orderBy: { appointmentAt: 'desc' },
      take: 3,
    });

    if (candidates.length === 0) {
      return null;
    }
    if (candidates.length > 1) {
      throw new BadRequestException(
        'Có nhiều lịch hẹn chưa thanh toán cho khách/thú cưng này. Vui lòng vào màn Lịch hẹn và bấm "Chuyển sang POS" để giữ đúng appointmentId.',
      );
    }

    return candidates[0];
  }

  private resolvePaymentProvider(method: PaymentMethod): string {
    if (method === PaymentMethod.payos || method === PaymentMethod.momo || method === PaymentMethod.zalopay) {
      return 'payos';
    }
    if (method === PaymentMethod.transfer) {
      return 'bank-transfer';
    }
    return 'pos';
  }

  private isInstantPayment(method: PaymentMethod): boolean {
    return method === PaymentMethod.cash || method === PaymentMethod.card;
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
