import { Controller, Get, Header, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';

@Controller('invoices')
@UseGuards(FirebaseAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get(':id')
  async getById(@CurrentUser() user: AuthUser | null, @Param('id') id: string) {
    if (!user) {
      return null;
    }
    return this.invoicesService.getById(id, user);
  }

  @Get(':id/pdf')
  @Header('Content-Type', 'application/pdf')
  async downloadPdf(
    @CurrentUser() user: AuthUser | null,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    if (!user) {
      return res.status(401).send('Unauthorized');
    }
    const buffer = await this.invoicesService.createPdf(id, user);
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${id}.pdf"`);
    res.send(buffer);
  }
}
