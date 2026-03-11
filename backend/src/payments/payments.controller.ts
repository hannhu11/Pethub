import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePayosLinkDto } from './dto/create-payos-link.dto';
import { PayosWebhookDto } from './dto/payos-webhook.dto';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('payos/create-link')
  @UseGuards(FirebaseAuthGuard)
  async createLink(@Body() dto: CreatePayosLinkDto) {
    return this.paymentsService.createPayosLink(dto);
  }

  @Post('payos/webhook')
  async webhook(@Body() dto: PayosWebhookDto) {
    return this.paymentsService.handlePayosWebhook(dto);
  }
}
