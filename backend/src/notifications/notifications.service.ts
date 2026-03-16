import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationTarget, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { NotificationsQueryDto } from './dto/notifications-query.dto';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async list(currentUser: AuthUser, query: NotificationsQueryDto) {
    const filter = query.filter ?? 'all';
    const visibilityWhere = this.buildVisibilityWhere(currentUser);
    const filterWhere = this.buildFilterWhere(filter);

    const [notifications, totalCount, unreadCount, readCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: {
          ...visibilityWhere,
          ...filterWhere,
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      this.prisma.notification.count({
        where: visibilityWhere,
      }),
      this.prisma.notification.count({
        where: {
          ...visibilityWhere,
          read: false,
        },
      }),
      this.prisma.notification.count({
        where: {
          ...visibilityWhere,
          read: true,
        },
      }),
    ]);

    return {
      items: notifications,
      unread: unreadCount,
      filter,
      counts: {
        all: totalCount,
        unread: unreadCount,
        read: readCount,
      },
    };
  }

  async markRead(currentUser: AuthUser, id: string) {
    const visibilityWhere = this.buildVisibilityWhere(currentUser);
    const existing = await this.prisma.notification.findFirst({
      where: {
        id,
        ...visibilityWhere,
      },
    });

    if (!existing) {
      throw new NotFoundException('Notification not found');
    }

    const item = await this.prisma.notification.update({
      where: { id },
      data: { read: true, readAt: new Date() },
    });

    const unread = await this.prisma.notification.count({
      where: {
        ...visibilityWhere,
        read: false,
      },
    });

    this.realtimeService.emitNotificationRead({
      clinicId: currentUser.clinicId,
      id: item.id,
      unread,
      userId: currentUser.userId,
    });

    return { item, unread };
  }

  async markAllRead(currentUser: AuthUser) {
    const visibilityWhere = this.buildVisibilityWhere(currentUser);
    const updated = await this.prisma.notification.updateMany({
      where: {
        ...visibilityWhere,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    this.realtimeService.emitNotificationRead({
      clinicId: currentUser.clinicId,
      userId: currentUser.userId,
      unread: 0,
      markAll: true,
    });

    return {
      updated: updated.count,
      unread: 0,
    };
  }

  private buildVisibilityWhere(currentUser: AuthUser): Prisma.NotificationWhereInput {
    return {
      clinicId: currentUser.clinicId,
      OR: [
        { userId: currentUser.userId },
        { target: NotificationTarget.all },
        { target: currentUser.role === 'manager' ? NotificationTarget.manager : NotificationTarget.customer },
      ],
    };
  }

  private buildFilterWhere(filter: 'all' | 'unread' | 'read'): Prisma.NotificationWhereInput {
    if (filter === 'unread') {
      return { read: false };
    }
    if (filter === 'read') {
      return { read: true };
    }
    return {};
  }
}
