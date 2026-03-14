import { Body, Controller, Get, Headers, HttpCode, Logger, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePayosLinkDto } from './dto/create-payos-link.dto';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

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
  async webhook(
    @Body() dto: unknown,
    @Headers() headers?: Record<string, string | string[] | undefined>,
  ) {
    const signatureHeader = this.resolveSignatureHeader(headers);
    try {
      const result = await this.paymentsService.handlePayosWebhook(dto, signatureHeader);
      return {
        code: '00',
        desc: 'success',
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error(
        `payOS webhook processing failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        code: '00',
        desc: 'success',
        success: true,
        data: {
          acknowledged: true,
          ignored: true,
          reason: 'handler_error',
        },
      };
    }
  }

  @Post('payos-webhook')
  @HttpCode(200)
  async webhookLegacy(
    @Body() dto: unknown,
    @Headers() headers?: Record<string, string | string[] | undefined>,
  ) {
    return this.webhook(dto, headers);
  }

  @Get('payos/webhook')
  async webhookHealth() {
    return {
      code: '00',
      desc: 'success',
      success: true,
      message: 'payOS webhook endpoint is alive. Use HTTP POST for payment events.',
    };
  }

  @Get('payos-webhook')
  async webhookLegacyHealth() {
    return this.webhookHealth();
  }

  private resolveSignatureHeader(
    headers?: Record<string, string | string[] | undefined>,
  ): string | undefined {
    if (!headers) {
      return undefined;
    }

    const candidates = [
      headers['x-payos-signature'],
      headers['x-signature'],
      headers['signature'],
      headers['x-signature-hmac-sha256'],
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate.trim();
      }
      if (Array.isArray(candidate)) {
        const first = candidate.find((item) => typeof item === 'string' && item.trim().length > 0);
        if (first) {
          return first.trim();
        }
      }
    }

    return undefined;
  }
}
