import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationTarget, ReminderChannel, ReminderStatus } from '@prisma/client';
import axios from 'axios';
import { PrismaService } from '../database/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { RemindersQueryDto } from './dto/reminders-query.dto';
import { CreateReminderFromTemplateDto } from './dto/create-reminder-from-template.dto';
import type { AuthUser } from '../common/interfaces/auth-user.interface';

@Injectable()
export class RemindersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async list(_currentUser: AuthUser, query: RemindersQueryDto) {
    const clinicId = _currentUser.clinicId;
    const items = await this.prisma.reminder.findMany({
      where: {
        clinicId,
        ...(query.status ? { status: query.status } : {}),
      },
      include: {
        customer: true,
        pet: true,
      },
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
      take: 300,
    });

    const [sent, failed, scheduled, cancelled] = await Promise.all([
      this.prisma.reminder.count({ where: { clinicId, status: ReminderStatus.sent } }),
      this.prisma.reminder.count({ where: { clinicId, status: ReminderStatus.failed } }),
      this.prisma.reminder.count({ where: { clinicId, status: ReminderStatus.scheduled } }),
      this.prisma.reminder.count({ where: { clinicId, status: ReminderStatus.cancelled } }),
    ]);

    const successDenominator = sent + failed;
    const successRate = successDenominator === 0 ? 0 : Math.round((sent / successDenominator) * 100);

    return {
      items,
      metrics: {
        sent,
        failed,
        scheduled,
        cancelled,
        successRate,
      },
    };
  }

  async createFromTemplate(dto: CreateReminderFromTemplateDto, currentUser: AuthUser) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: dto.customerId,
        clinicId: currentUser.clinicId,
      },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const pet = await this.prisma.pet.findFirst({
      where: {
        id: dto.petId,
        clinicId: currentUser.clinicId,
      },
    });
    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    const clinic = await this.prisma.clinicSettings.findFirst({
      where: {
        clinicId: currentUser.clinicId,
      },
      orderBy: { updatedAt: 'desc' },
    });
    const template = dto.templateId
      ? await this.prisma.reminderTemplate.findFirst({
          where: {
            id: dto.templateId,
            clinicId: currentUser.clinicId,
          },
        })
      : dto.templateName
        ? await this.prisma.reminderTemplate.findUnique({
            where: {
              clinicId_name: {
                clinicId: currentUser.clinicId,
                name: dto.templateName,
              },
            },
          })
        : null;

    const baseMessage =
      dto.overrideMessage ??
      template?.messageTemplate ??
      'Kinh gui [CustomerName], be [PetName] da den lich cham soc. Vui long dat hen tai [ClinicName].';

    const message = baseMessage
      .replaceAll('[CustomerName]', customer.name)
      .replaceAll('[PetName]', pet.name)
      .replaceAll('[ClinicName]', clinic?.clinicName ?? 'PetHub Clinic');

    const scheduleAt = dto.scheduleAt ? new Date(dto.scheduleAt) : null;
    const sendNow = dto.sendNow ?? false;
    let status: ReminderStatus = sendNow ? ReminderStatus.sent : ReminderStatus.scheduled;
    let sentAt: Date | null = sendNow ? new Date() : null;
    let failedReason: string | null = null;

    if (sendNow) {
      const delivery = await this.dispatchReminder({
        channel: dto.channel,
        toEmail: customer.email,
        customerName: customer.name,
        petName: pet.name,
        message,
      });
      if (!delivery.sent) {
        status = ReminderStatus.failed;
        sentAt = null;
        failedReason = delivery.reason;
      }
    }

    const reminder = await this.prisma.reminder.create({
      data: {
        clinicId: currentUser.clinicId,
        customerId: customer.id,
        petId: pet.id,
        channel: dto.channel,
        templateName: template?.name ?? dto.templateName ?? 'manual-template',
        message,
        scheduledAt: sendNow ? new Date() : scheduleAt,
        sentAt,
        failedReason,
        status,
      },
      include: {
        customer: true,
        pet: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        clinicId: currentUser.clinicId,
        actorId: currentUser.userId,
        action: 'reminder.create.from-template',
        entityType: 'reminder',
        entityId: reminder.id,
        after: {
          channel: reminder.channel,
          status: reminder.status,
        },
      },
    });

    this.realtimeService.emitReminderUpdated({
      type: 'created',
      reminderId: reminder.id,
      status: reminder.status,
    });
    if (sendNow) {
      await this.createReminderNotifications(currentUser, reminder);
    }

    return {
      reminder,
    };
  }

  async cancel(id: string, currentUser: AuthUser) {
    const reminder = await this.prisma.reminder.findFirst({
      where: {
        id,
        clinicId: currentUser.clinicId,
      },
    });
    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }

    const updated = await this.prisma.reminder.update({
      where: { id },
      data: {
        status: ReminderStatus.cancelled,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        clinicId: currentUser.clinicId,
        actorId: currentUser.userId,
        action: 'reminder.cancel',
        entityType: 'reminder',
        entityId: id,
        before: {
          status: reminder.status,
        },
        after: {
          status: updated.status,
        },
      },
    });

    this.realtimeService.emitReminderUpdated({
      type: 'cancelled',
      reminderId: id,
      status: updated.status,
    });

    return {
      reminder: updated,
    };
  }

  private async dispatchReminder(input: {
    channel: ReminderChannel;
    toEmail: string | null;
    customerName: string;
    petName: string;
    message: string;
  }): Promise<{ sent: boolean; reason: string | null }> {
    if (input.channel === ReminderChannel.email) {
      return this.dispatchEmailReminder(input.toEmail, input.message);
    }

    return {
      sent: false,
      reason: 'Kênh SMS chưa cấu hình nhà cung cấp. Vui lòng cấu hình gateway SMS.',
    };
  }

  private async dispatchEmailReminder(
    toEmail: string | null,
    message: string,
  ): Promise<{ sent: boolean; reason: string | null }> {
    if (!toEmail) {
      return { sent: false, reason: 'Khách hàng chưa có email để nhận nhắc nhở.' };
    }

    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.RESEND_FROM_EMAIL?.trim() || process.env.RESEND_FROM?.trim();
    if (!apiKey || !from) {
      return {
        sent: false,
        reason: 'Thiếu cấu hình RESEND_API_KEY hoặc RESEND_FROM_EMAIL trên máy chủ.',
      };
    }

    try {
      await axios.post(
        'https://api.resend.com/emails',
        {
          from,
          to: [toEmail],
          subject: 'PetHub - Nhắc lịch chăm sóc thú cưng',
          text: message,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 20000,
        },
      );

      return { sent: true, reason: null };
    } catch (error) {
      return {
        sent: false,
        reason: this.extractDeliveryError(error),
      };
    }
  }

  private extractDeliveryError(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const message =
        (error.response?.data as { message?: string; error?: string } | undefined)?.message ||
        (error.response?.data as { message?: string; error?: string } | undefined)?.error ||
        error.message;
      return `Gửi email thất bại: ${message}`;
    }
    if (error instanceof Error) {
      return `Gửi email thất bại: ${error.message}`;
    }
    return 'Gửi email thất bại do lỗi không xác định.';
  }

  private async createReminderNotifications(
    currentUser: AuthUser,
    reminder: {
      id: string;
      status: ReminderStatus;
      channel: ReminderChannel;
      failedReason: string | null;
      customerId: string;
      customer: { id: string; userId: string | null; name: string };
      pet: { name: string };
    },
  ) {
    const managerTitle = reminder.status === ReminderStatus.sent ? 'Nhắc nhở đã gửi' : 'Nhắc nhở gửi thất bại';
    const managerBody =
      reminder.status === ReminderStatus.sent
        ? `Đã gửi nhắc nhở ${reminder.channel.toUpperCase()} cho ${reminder.customer.name} (${reminder.pet.name}).`
        : `Nhắc nhở ${reminder.channel.toUpperCase()} cho ${reminder.customer.name} thất bại: ${reminder.failedReason || 'không rõ lý do'}.`;

    await this.prisma.notification.create({
      data: {
        clinicId: currentUser.clinicId,
        customerId: reminder.customerId,
        target: NotificationTarget.manager,
        title: managerTitle,
        body: managerBody,
        linkTo: '/manager/reminders',
      },
    });

    if (reminder.status === ReminderStatus.sent && reminder.customer.userId) {
      await this.prisma.notification.create({
        data: {
          clinicId: currentUser.clinicId,
          customerId: reminder.customerId,
          userId: reminder.customer.userId,
          target: NotificationTarget.customer,
          title: 'Bạn có nhắc nhở mới',
          body: `PetHub vừa gửi nhắc nhở chăm sóc cho thú cưng ${reminder.pet.name}.`,
          linkTo: '/customer/appointments',
        },
      });
    }

    this.realtimeService.emitNotificationCreated({
      type: 'reminder.notification',
      reminderId: reminder.id,
      status: reminder.status,
      clinicId: currentUser.clinicId,
    });
  }
}
