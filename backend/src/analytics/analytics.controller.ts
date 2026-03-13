import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@Controller('analytics')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('manager')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  async overview(@CurrentUser() user: AuthUser | null, @Query() query: AnalyticsQueryDto) {
    if (!user) {
      return null;
    }
    return this.analyticsService.getOverview(user, query);
  }

  @Get('customers/ltv-summary')
  async customerLtv(@CurrentUser() user: AuthUser | null) {
    if (!user) {
      return null;
    }
    return this.analyticsService.getCustomerLtvSummary(user);
  }
}
