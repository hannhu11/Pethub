import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationTarget } from '@prisma/client';
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

    const notifications = await this.prisma.notification.findMany({
      where: {
        clinicId: currentUser.clinicId,
        OR: [
          { userId: currentUser.userId },
          { target: NotificationTarget.all },
          { target: currentUser.role === 'manager' ? NotificationTarget.manager : NotificationTarget.customer },
        ],
        ...(filter === 'unread' ? { read: false } : {}),
        ...(filter === 'read' ? { read: true } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const unread = await this.prisma.notification.count({
      where: {
        clinicId: currentUser.clinicId,
        OR: [
          { userId: currentUser.userId },
          { target: NotificationTarget.all },
          { target: currentUser.role === 'manager' ? NotificationTarget.manager : NotificationTarget.customer },
        ],
        read: false,
      },
    });

    return {
      items: notifications,
      unread,
      filter,
    };
  }

  async markRead(currentUser: AuthUser, id: string) {
    const existing = await this.prisma.notification.findFirst({
      where: {
        clinicId: currentUser.clinicId,
        id,
        OR: [
          { userId: currentUser.userId },
          { target: NotificationTarget.all },
          { target: currentUser.role === 'manager' ? NotificationTarget.manager : NotificationTarget.customer },
        ],
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
        clinicId: currentUser.clinicId,
        OR: [
          { userId: currentUser.userId },
          { target: NotificationTarget.all },
          { target: currentUser.role === 'manager' ? NotificationTarget.manager : NotificationTarget.customer },
        ],
        read: false,
      },
    });

    this.realtimeService.emitNotificationRead({
      id: item.id,
      unread,
      userId: currentUser.userId,
    });

    return { item, unread };
  }

  async markAllRead(currentUser: AuthUser) {
    const updated = await this.prisma.notification.updateMany({
      where: {
        clinicId: currentUser.clinicId,
        OR: [
          { userId: currentUser.userId },
          { target: NotificationTarget.all },
          { target: currentUser.role === 'manager' ? NotificationTarget.manager : NotificationTarget.customer },
        ],
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    this.realtimeService.emitNotificationRead({
      userId: currentUser.userId,
      unread: 0,
      markAll: true,
    });

    return {
      updated: updated.count,
      unread: 0,
    };
  }
}
