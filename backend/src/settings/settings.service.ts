import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash, compare } from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';

type NotificationSettingsResponse = {
  emailBooking: boolean;
  emailReminder: boolean;
  smsBooking: boolean;
  smsReminder: boolean;
  dailyReport: boolean;
  weeklyReport: boolean;
  updatedAt: string | null;
};

@Injectable()
export class SettingsService {
  private readonly defaultNotificationSettings = {
    emailBooking: true,
    emailReminder: true,
    smsBooking: false,
    smsReminder: true,
    dailyReport: true,
    weeklyReport: false,
  } as const;

  constructor(private readonly prisma: PrismaService) {}

  private get notificationSettingsModel() {
    return (this.prisma as unknown as { notificationSettings: any }).notificationSettings;
  }

  async getSettings(currentUser: AuthUser) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: currentUser.userId,
        clinicId: currentUser.clinicId,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [clinic, clinicProfile, rawSubscription, notificationSettings, petCount] = await Promise.all([
      this.prisma.clinicSettings.findFirst({
        where: {
          clinicId: currentUser.clinicId,
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.clinic.findUnique({
        where: {
          id: currentUser.clinicId,
        },
        select: {
          createdAt: true,
        },
      }),
      this.prisma.subscription.findFirst({
        where: {
          clinicId: currentUser.clinicId,
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.notificationSettingsModel.findUnique({
        where: {
          clinicId: currentUser.clinicId,
        },
      }),
      this.prisma.pet.count({
        where: {
          clinicId: currentUser.clinicId,
        },
      }),
    ]);

    const now = new Date();
    let subscription = rawSubscription;

    if (
      subscription &&
      this.isPremiumSubscription(subscription.planCode, subscription.planName, subscription.isActive) &&
      subscription.expiresAt &&
      subscription.expiresAt.getTime() <= now.getTime()
    ) {
      subscription = await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          planCode: 'basic-free',
          planName: 'Basic',
          amount: 0,
          isActive: false,
          startedAt: null,
          expiresAt: null,
        },
      });
    }

    const isPremiumActive = Boolean(
      subscription &&
        this.isPremiumSubscription(subscription.planCode, subscription.planName, subscription.isActive),
    );
    const startedAt = isPremiumActive
      ? subscription?.startedAt?.toISOString() ?? null
      : clinicProfile?.createdAt?.toISOString() ?? null;
    const expiresAt = isPremiumActive ? subscription?.expiresAt?.toISOString() ?? null : null;
    const remainingDays = isPremiumActive
      ? this.calculateRemainingDays(subscription?.expiresAt ?? null, now)
      : null;

    return {
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      clinic,
      subscription,
      billing: {
        startedAt,
        expiresAt,
        remainingDays,
      },
      usage: {
        petCount,
      },
      notifications: this.toNotificationSettingsResponse(notificationSettings),
    };
  }

  private isPremiumSubscription(planCode?: string | null, planName?: string | null, isActive?: boolean | null) {
    if (!isActive) {
      return false;
    }

    const hasPremiumCode = planCode?.toLowerCase().includes('premium') ?? false;
    const hasPremiumName = planName?.toLowerCase().includes('premium') ?? false;
    if (!planCode && !planName) {
      return true;
    }
    return hasPremiumCode || hasPremiumName;
  }

  private calculateRemainingDays(expiresAt: Date | null, now: Date): number | null {
    if (!expiresAt) {
      return null;
    }
    const remainingMs = expiresAt.getTime() - now.getTime();
    if (remainingMs <= 0) {
      return 0;
    }
    return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  }

  async updateProfile(currentUser: AuthUser, dto: UpdateProfileDto) {
    await this.ensureSensitivePassword(currentUser.userId, dto.confirmPassword);

    const updated = await this.prisma.user.update({
      where: { id: currentUser.userId },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
      },
    });

    if (updated.role === 'customer') {
      await this.prisma.customer.updateMany({
        where: {
          clinicId: currentUser.clinicId,
          userId: currentUser.userId,
        },
        data: {
          name: updated.name,
          email: updated.email,
          phone: updated.phone,
        },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        clinicId: currentUser.clinicId,
        actorId: currentUser.userId,
        action: 'settings.profile.update',
        entityType: 'user',
        entityId: currentUser.userId,
      },
    });

    return {
      profile: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        role: updated.role,
      },
    };
  }

  async updateClinic(currentUser: AuthUser, dto: UpdateClinicDto) {
    if (currentUser.role !== 'manager') {
      throw new ForbiddenException('Only manager can update clinic settings');
    }

    await this.ensureSensitivePassword(currentUser.userId, dto.confirmPassword);

    const existing = await this.prisma.clinicSettings.findFirst({
      where: {
        clinicId: currentUser.clinicId,
      },
      orderBy: { createdAt: 'asc' },
    });

    const clinic = existing
      ? await this.prisma.clinicSettings.update({
          where: { id: existing.id },
          data: {
            clinicName: dto.clinicName,
            taxId: dto.taxId,
            phone: dto.phone,
            address: dto.address,
            invoiceNote: dto.invoiceNote,
            timezone: dto.timezone ?? 'Asia/Ho_Chi_Minh',
            updatedById: currentUser.userId,
          },
        })
      : await this.prisma.clinicSettings.create({
          data: {
            clinicId: currentUser.clinicId,
            clinicName: dto.clinicName,
            taxId: dto.taxId,
            phone: dto.phone,
            address: dto.address,
            invoiceNote: dto.invoiceNote,
            timezone: dto.timezone ?? 'Asia/Ho_Chi_Minh',
            updatedById: currentUser.userId,
          },
        });

    await this.prisma.auditLog.create({
      data: {
        clinicId: currentUser.clinicId,
        actorId: currentUser.userId,
        action: 'settings.clinic.update',
        entityType: 'clinic_settings',
        entityId: clinic.id,
      },
    });

    return { clinic };
  }

  async updatePassword(currentUser: AuthUser, dto: UpdatePasswordDto) {
    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new BadRequestException('New password confirmation does not match');
    }

    await this.ensureSensitivePassword(currentUser.userId, dto.currentPassword);

    const passwordHash = await hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: currentUser.userId },
      data: {
        passwordHash,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        clinicId: currentUser.clinicId,
        actorId: currentUser.userId,
        action: 'settings.password.update',
        entityType: 'user',
        entityId: currentUser.userId,
      },
    });

    return {
      success: true,
      changedAt: new Date().toISOString(),
    };
  }

  async getNotificationSettings(currentUser: AuthUser): Promise<{ notifications: NotificationSettingsResponse }> {
    if (currentUser.role !== 'manager') {
      throw new ForbiddenException('Only manager can view notification settings');
    }

    const settings = await this.notificationSettingsModel.findUnique({
      where: {
        clinicId: currentUser.clinicId,
      },
    });

    return {
      notifications: this.toNotificationSettingsResponse(settings),
    };
  }

  async updateNotificationSettings(
    currentUser: AuthUser,
    dto: UpdateNotificationSettingsDto,
  ): Promise<{ notifications: NotificationSettingsResponse }> {
    if (currentUser.role !== 'manager') {
      throw new ForbiddenException('Only manager can update notification settings');
    }

    const current = await this.notificationSettingsModel.findUnique({
      where: {
        clinicId: currentUser.clinicId,
      },
    });

    const merged = {
      emailBooking: dto.emailBooking ?? current?.emailBooking ?? this.defaultNotificationSettings.emailBooking,
      emailReminder: dto.emailReminder ?? current?.emailReminder ?? this.defaultNotificationSettings.emailReminder,
      smsBooking: dto.smsBooking ?? current?.smsBooking ?? this.defaultNotificationSettings.smsBooking,
      smsReminder: dto.smsReminder ?? current?.smsReminder ?? this.defaultNotificationSettings.smsReminder,
      dailyReport: dto.dailyReport ?? current?.dailyReport ?? this.defaultNotificationSettings.dailyReport,
      weeklyReport: dto.weeklyReport ?? current?.weeklyReport ?? this.defaultNotificationSettings.weeklyReport,
    };

    const updated = await this.notificationSettingsModel.upsert({
      where: {
        clinicId: currentUser.clinicId,
      },
      create: {
        clinicId: currentUser.clinicId,
        ...merged,
      },
      update: merged,
    });

    await this.prisma.auditLog.create({
      data: {
        clinicId: currentUser.clinicId,
        actorId: currentUser.userId,
        action: 'settings.notifications.update',
        entityType: 'notification_settings',
        entityId: updated.id,
        before: current
          ? {
              emailBooking: current.emailBooking,
              emailReminder: current.emailReminder,
              smsBooking: current.smsBooking,
              smsReminder: current.smsReminder,
              dailyReport: current.dailyReport,
              weeklyReport: current.weeklyReport,
            }
          : undefined,
        after: merged,
      },
    });

    return {
      notifications: this.toNotificationSettingsResponse(updated),
    };
  }

  private async ensureSensitivePassword(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.passwordHash) {
      const fallback = process.env.DEFAULT_SENSITIVE_PASSWORD;
      if (!fallback || fallback.trim().length < 12) {
        throw new ForbiddenException(
          'Sensitive password is not configured. Set DEFAULT_SENSITIVE_PASSWORD (>=12 chars).',
        );
      }
      if (password !== fallback) {
        throw new ForbiddenException('Invalid confirmation password');
      }
      return;
    }

    const valid = await compare(password, user.passwordHash);
    if (!valid) {
      throw new ForbiddenException('Invalid confirmation password');
    }
  }

  private toNotificationSettingsResponse(
    settings:
      | {
          emailBooking: boolean;
          emailReminder: boolean;
          smsBooking: boolean;
          smsReminder: boolean;
          dailyReport: boolean;
          weeklyReport: boolean;
          updatedAt: Date;
        }
      | null,
  ): NotificationSettingsResponse {
    return {
      emailBooking: settings?.emailBooking ?? this.defaultNotificationSettings.emailBooking,
      emailReminder: settings?.emailReminder ?? this.defaultNotificationSettings.emailReminder,
      smsBooking: settings?.smsBooking ?? this.defaultNotificationSettings.smsBooking,
      smsReminder: settings?.smsReminder ?? this.defaultNotificationSettings.smsReminder,
      dailyReport: settings?.dailyReport ?? this.defaultNotificationSettings.dailyReport,
      weeklyReport: settings?.weeklyReport ?? this.defaultNotificationSettings.weeklyReport,
      updatedAt: settings?.updatedAt?.toISOString() ?? null,
    };
  }
}
