import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { PrismaService } from '../database/prisma.service';
import type { AuthUser } from '../common/interfaces/auth-user.interface';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async getById(id: string, currentUser: AuthUser) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id,
        clinicId: currentUser.clinicId,
      },
      include: {
        customer: true,
        items: true,
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

    return {
      invoice,
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
}
