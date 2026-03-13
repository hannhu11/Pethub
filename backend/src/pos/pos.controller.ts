import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { PosService } from './pos.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { PosPrefillQueryDto } from './dto/pos-prefill-query.dto';
import { PosCheckoutDto } from './dto/pos-checkout.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('pos')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('manager')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Get('prefill')
  async prefill(@CurrentUser() user: AuthUser | null, @Query() query: PosPrefillQueryDto) {
    if (!user) {
      return { appointment: null };
    }
    return this.posService.getPrefill(user, query);
  }

  @Post('checkout')
  async checkout(@CurrentUser() user: AuthUser | null, @Body() dto: PosCheckoutDto) {
    if (!user) {
      return null;
    }

    return this.posService.checkout(dto, user);
  }
}
