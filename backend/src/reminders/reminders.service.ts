import { Injectable, NotFoundException } from '@nestjs/common';
import { ReminderStatus } from '@prisma/client';
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
    const items = await this.prisma.reminder.findMany({
      where: query.status ? { status: query.status } : undefined,
      include: {
        customer: true,
        pet: true,
      },
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
      take: 300,
    });

    const [sent, failed, scheduled, cancelled] = await Promise.all([
      this.prisma.reminder.count({ where: { status: ReminderStatus.sent } }),
      this.prisma.reminder.count({ where: { status: ReminderStatus.failed } }),
      this.prisma.reminder.count({ where: { status: ReminderStatus.scheduled } }),
      this.prisma.reminder.count({ where: { status: ReminderStatus.cancelled } }),
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
    const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const pet = await this.prisma.pet.findUnique({ where: { id: dto.petId } });
    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    const clinic = await this.prisma.clinicSettings.findFirst({ orderBy: { updatedAt: 'desc' } });
    const template = dto.templateId
      ? await this.prisma.reminderTemplate.findUnique({ where: { id: dto.templateId } })
      : dto.templateName
        ? await this.prisma.reminderTemplate.findUnique({ where: { name: dto.templateName } })
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
    const status = sendNow ? ReminderStatus.sent : ReminderStatus.scheduled;

    const reminder = await this.prisma.reminder.create({
      data: {
        customerId: customer.id,
        petId: pet.id,
        channel: dto.channel,
        templateName: template?.name ?? dto.templateName ?? 'manual-template',
        message,
        scheduledAt: sendNow ? new Date() : scheduleAt,
        sentAt: sendNow ? new Date() : null,
        status,
      },
      include: {
        customer: true,
        pet: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
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

    return {
      reminder,
    };
  }

  async cancel(id: string, currentUser: AuthUser) {
    const reminder = await this.prisma.reminder.findUnique({ where: { id } });
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
}
