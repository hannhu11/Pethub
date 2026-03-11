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

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(currentUser: AuthUser) {
    const user = await this.prisma.user.findUnique({ where: { id: currentUser.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const clinic = await this.prisma.clinicSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    const subscription = await this.prisma.subscription.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

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
    };
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

    await this.prisma.auditLog.create({
      data: {
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

    const existing = await this.prisma.clinicSettings.findFirst({ orderBy: { createdAt: 'asc' } });

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

  private async ensureSensitivePassword(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.passwordHash) {
      const fallback = process.env.DEFAULT_SENSITIVE_PASSWORD ?? 'admin12345';
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
}
