import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { RemindersQueryDto } from './dto/reminders-query.dto';
import { CreateReminderFromTemplateDto } from './dto/create-reminder-from-template.dto';

@Controller('reminders')
@UseGuards(FirebaseAuthGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser | null, @Query() query: RemindersQueryDto) {
    if (!user) {
      return { items: [], metrics: { sent: 0, failed: 0, scheduled: 0, cancelled: 0, successRate: 0 } };
    }

    return this.remindersService.list(user, query);
  }

  @Post('from-template')
  async createFromTemplate(
    @CurrentUser() user: AuthUser | null,
    @Body() dto: CreateReminderFromTemplateDto,
  ) {
    if (!user) {
      return null;
    }

    return this.remindersService.createFromTemplate(dto, user);
  }

  @Patch(':id/cancel')
  async cancel(@CurrentUser() user: AuthUser | null, @Param('id') id: string) {
    if (!user) {
      return null;
    }

    return this.remindersService.cancel(id, user);
  }
}
