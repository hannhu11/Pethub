import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { NotificationsQueryDto } from './dto/notifications-query.dto';

@Controller('notifications')
@UseGuards(FirebaseAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser | null, @Query() query: NotificationsQueryDto) {
    if (!user) {
      return { items: [], unread: 0, filter: query.filter ?? 'all' };
    }

    return this.notificationsService.list(user, query);
  }

  @Patch('read-all')
  async markAllRead(@CurrentUser() user: AuthUser | null) {
    if (!user) {
      return { updated: 0, unread: 0 };
    }

    return this.notificationsService.markAllRead(user);
  }

  @Patch(':id/read')
  async markRead(@CurrentUser() user: AuthUser | null, @Param('id') id: string) {
    if (!user) {
      return { item: null, unread: 0 };
    }

    return this.notificationsService.markRead(user, id);
  }
}
