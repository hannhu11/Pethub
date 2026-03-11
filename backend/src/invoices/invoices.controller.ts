import { Controller, Get, Header, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@Controller('invoices')
@UseGuards(FirebaseAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.invoicesService.getById(id);
  }

  @Get(':id/pdf')
  @Header('Content-Type', 'application/pdf')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.invoicesService.createPdf(id);
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${id}.pdf"`);
    res.send(buffer);
  }
}
