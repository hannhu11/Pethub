import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { PrismaService } from '../database/prisma.service';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async listForLedger(currentUser: AuthUser) {
    if (currentUser.role !== 'manager') {
      throw new ForbiddenException('Only manager can view invoice ledger');
    }

    const invoices = await this.prisma.invoice.findMany({
      where: {
        clinicId: currentUser.clinicId,
      },
      orderBy: [{ issuedAt: 'desc' }, { createdAt: 'desc' }],
      take: 500,
      select: {
        id: true,
        invoiceNo: true,
        issuedAt: true,
        createdAt: true,
        paymentMethod: true,
        paymentStatus: true,
        grandTotal: true,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        appointment: {
          select: {
            id: true,
            pet: {
              select: {
                id: true,
                name: true,
                species: true,
              },
            },
          },
        },
      },
    });

    return {
      items: invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNo: invoice.invoiceNo,
        issuedAt: invoice.issuedAt.toISOString(),
        createdAt: invoice.createdAt.toISOString(),
        paymentMethod: invoice.paymentMethod,
        paymentStatus: invoice.paymentStatus,
        grandTotal: Number(invoice.grandTotal ?? 0),
        customer: invoice.customer
          ? {
              id: invoice.customer.id,
              name: invoice.customer.name,
              phone: invoice.customer.phone,
            }
          : null,
        pet: invoice.appointment?.pet
          ? {
              id: invoice.appointment.pet.id,
              name: invoice.appointment.pet.name,
              species: invoice.appointment.pet.species,
            }
          : null,
      })),
    };
  }

  async getById(id: string, currentUser: AuthUser) {
    await this.paymentsService.syncInvoicePaymentStatusIfNeeded(currentUser.clinicId, id);

    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id,
        clinicId: currentUser.clinicId,
      },
      include: {
        customer: true,
        items: true,
        paymentTxns: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        appointment: {
          include: {
            pet: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (currentUser.role === 'customer') {
      const customer = await this.prisma.customer.findFirst({
        where: {
          clinicId: currentUser.clinicId,
          userId: currentUser.userId,
        },
      });
      if (!customer || customer.id !== invoice.customerId) {
        throw new ForbiddenException('Not allowed to access this invoice');
      }
    }

    const clinic = await this.prisma.clinicSettings.findFirst({
      where: {
        clinicId: currentUser.clinicId,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const paymentAction = this.resolvePayosAction(invoice.paymentTxns);

    return {
      invoice,
      paymentAction,
      clinic,
    };
  }

  async createPdf(id: string, currentUser: AuthUser): Promise<Buffer> {
    const { invoice, clinic } = await this.getById(id, currentUser);

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const draw = (text: string, x: number, y: number, size = 12, isBold = false) => {
      page.drawText(text, {
        x,
        y,
        size,
        font: isBold ? bold : font,
        color: rgb(0.1, 0.1, 0.1),
      });
    };

    let y = 790;
    draw(clinic?.clinicName ?? 'PetHub Clinic', 50, y, 22, true);
    y -= 22;
    draw(clinic?.address ?? 'Vietnam', 50, y, 12);
    y -= 18;
    draw(`Hotline: ${clinic?.phone ?? 'N/A'}`, 50, y, 12);
    draw('HOA DON THANH TOAN', 350, 790, 18, true);
    draw(`Ma: ${invoice.invoiceNo}`, 350, 770, 12);
    draw(`Ngay: ${invoice.issuedAt.toISOString()}`, 350, 754, 10);

    y = 720;
    draw('Khach hang:', 50, y, 12, true);
    draw(invoice.customer.name, 140, y, 12);
    y -= 16;
    draw('So dien thoai:', 50, y, 12, true);
    draw(invoice.customer.phone, 140, y, 12);
    y -= 24;

    draw('Danh sach muc:', 50, y, 13, true);
    y -= 18;

    for (const item of invoice.items) {
      draw(`- ${item.name} x${item.qty}`, 60, y, 11);
      draw(`${Number(item.total).toLocaleString('vi-VN')} VND`, 420, y, 11);
      y -= 15;
      if (y < 120) {
        break;
      }
    }

    y -= 20;
    draw(`Tam tinh: ${Number(invoice.subtotal).toLocaleString('vi-VN')} VND`, 330, y, 12);
    y -= 16;
    draw(`VAT (${Number(invoice.taxPercent)}%): ${Number(invoice.taxAmount).toLocaleString('vi-VN')} VND`, 330, y, 12);
    y -= 18;
    draw(`Tong cong: ${Number(invoice.grandTotal).toLocaleString('vi-VN')} VND`, 330, y, 14, true);

    y -= 30;
    draw(clinic?.invoiceNote ?? 'Cam on quy khach da su dung dich vu tai PetHub!', 50, y, 11);

    const bytes = await pdfDoc.save();
    return Buffer.from(bytes);
  }

  private resolvePayosAction(
    transactions: Array<{
      provider: string;
      providerRef: string | null;
      paymentMethod: PaymentMethod;
      amount: unknown;
      metadata: unknown;
    }>,
  ) {
    const tx = transactions.find(
      (item) =>
        item.provider === 'payos' ||
        item.paymentMethod === PaymentMethod.payos ||
        item.paymentMethod === PaymentMethod.transfer,
    );
    if (!tx) {
      return null;
    }

    const metadata = this.toRecord(tx.metadata);
    const payosPayload = this.toRecord(metadata?.payos ?? metadata);
    const payosData = this.toRecord(payosPayload?.data ?? payosPayload);

    const checkoutUrl = this.toStringValue(payosData?.checkoutUrl ?? payosData?.checkout_url);
    if (!checkoutUrl) {
      return null;
    }

    const qrCode = this.toStringValue(payosData?.qrCode ?? payosData?.qr_code);
    const orderCode = this.toStringValue(payosData?.orderCode) || tx.providerRef || '';
    const amount = Number(tx.amount ?? 0);

    return {
      provider: 'payos' as const,
      orderCode,
      amount: Number.isFinite(amount) ? amount : 0,
      checkoutUrl,
      qrCode,
    };
  }

  private toRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    return value as Record<string, unknown>;
  }

  private toStringValue(value: unknown): string | null {
    if (typeof value === 'string') {
      const normalized = value.trim();
      return normalized.length > 0 ? normalized : null;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
    return null;
  }
}
