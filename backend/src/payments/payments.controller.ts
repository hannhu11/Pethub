import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePayosLinkDto } from './dto/create-payos-link.dto';
import { PayosWebhookDto } from './dto/payos-webhook.dto';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('payos/create-link')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('manager')
  async createLink(@CurrentUser() user: AuthUser | null, @Body() dto: CreatePayosLinkDto) {
    if (!user) {
      return null;
    }
    return this.paymentsService.createPayosLink(dto, user);
  }

  @Post('payos/webhook')
  @HttpCode(200)
  async webhook(@Body() dto: PayosWebhookDto) {
    return this.paymentsService.handlePayosWebhook(dto);
  }

  @Post('payos-webhook')
  @HttpCode(200)
  async webhookLegacy(@Body() dto: PayosWebhookDto) {
    return this.paymentsService.handlePayosWebhook(dto);
  }

  @Get('payos/webhook')
  async webhookHealth() {
    return {
      success: true,
      message: 'payOS webhook endpoint is alive. Use HTTP POST for payment events.',
    };
  }

  @Get('payos-webhook')
  async webhookLegacyHealth() {
    return this.webhookHealth();
  }
}
