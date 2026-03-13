import {
  BadRequestException,
  InternalServerErrorException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, Role, type User } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { FirebaseAdminService } from './firebase-admin.service';
import { SyncFirebaseDto } from './dto/sync-firebase.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';

export interface OnboardingState {
  required: boolean;
  missingFields: string[];
  nextStep: string | null;
}

export interface AuthMeResponse {
  user: AuthUser;
  onboarding: OnboardingState;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseAdminService: FirebaseAdminService,
  ) {}

  async syncFirebase(dto: SyncFirebaseDto): Promise<AuthMeResponse> {
    try {
      const decoded = await this.verifyIdTokenWithTimeout(dto.idToken);
      const clinicId = await this.resolveClinicId(dto.clinicSlug);
      const email = decoded.email ?? `${decoded.uid}@pethub.vn`;
      const normalizedPhone = dto.phone?.trim() ?? decoded.phone_number?.trim() ?? '';
      const displayName = dto.name?.trim() || decoded.name?.trim() || null;
      const user = await this.upsertUserForSync({
        firebaseUid: decoded.uid,
        clinicId,
        email,
        phone: normalizedPhone,
        displayName,
      });

      await this.upsertCustomerProfile(user);

      const onboarding = this.buildOnboardingState(
        user,
        decoded.firebase?.sign_in_provider ?? 'unknown',
      );

      return { user: this.toAuthUser(user), onboarding };
    } catch (error) {
      const stack = error instanceof Error ? error.stack : String(error);
      this.logger.error('Firebase sync failed', stack);

      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      if (this.isMissingClinicTableError(error)) {
        throw new ServiceUnavailableException(
          'He thong dang cap nhat du lieu. Vui long thu lai sau it phut.',
        );
      }

      throw new InternalServerErrorException(
        'May chu dang ban. Vui long thu lai sau.',
      );
    }
  }

  async getMe(currentUser: AuthUser | null): Promise<AuthMeResponse> {
    if (!currentUser) {
      throw new UnauthorizedException('Missing authenticated user context');
    }

    const user = await this.prisma.user.findUnique({ where: { id: currentUser.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.upsertCustomerProfile(user);

    return {
      user: this.toAuthUser(user),
      onboarding: this.buildOnboardingState(user, 'session'),
    };
  }

  async completeOnboarding(
    currentUser: AuthUser | null,
    dto: CompleteOnboardingDto,
  ): Promise<AuthMeResponse> {
    if (!currentUser) {
      throw new UnauthorizedException('Missing authenticated user context');
    }

    const existing = await this.prisma.user.findUnique({ where: { id: currentUser.userId } });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const clinicId = await this.resolveClinicId(dto.clinicSlug, existing.clinicId);
    const updated = await this.prisma.user.update({
      where: { id: currentUser.userId },
      data: {
        clinicId,
        name: dto.name.trim(),
        phone: dto.phone.trim(),
      },
    });

    await this.upsertCustomerProfile(updated);

    return {
      user: this.toAuthUser(updated),
      onboarding: this.buildOnboardingState(updated, 'manual'),
    };
  }

  async verifyAndResolveUser(idToken: string): Promise<AuthUser> {
    const decoded = await this.firebaseAdminService.verifyIdToken(idToken);
    const email = decoded.email ?? `${decoded.uid}@pethub.vn`;
    const user = await this.resolveUserByUidOrEmail(decoded.uid, email);
    if (!user) {
      throw new UnauthorizedException(
        'User not synchronized. Call /api/auth/sync-firebase first.',
      );
    }

    await this.upsertCustomerProfile(user);

    return this.toAuthUser(user);
  }

  private async upsertUserForSync(input: {
    firebaseUid: string;
    clinicId: string;
    email: string;
    phone: string;
    displayName: string | null;
  }): Promise<User> {
    const safeName = input.displayName ?? input.email.split('@')[0] ?? 'PetHub User';

    try {
      return await this.prisma.user.upsert({
        where: { firebaseUid: input.firebaseUid },
        update: {
          clinicId: input.clinicId,
          email: input.email,
          name: input.displayName ?? undefined,
          phone: input.phone || undefined,
        },
        create: {
          clinicId: input.clinicId,
          firebaseUid: input.firebaseUid,
          email: input.email,
          role: Role.customer,
          name: safeName,
          phone: input.phone,
        },
      });
    } catch (error) {
      if (!this.isUniqueConstraintError(error)) {
        throw error;
      }

      const existing = await this.prisma.user.findFirst({
        where: {
          OR: [
            { firebaseUid: input.firebaseUid },
            {
              clinicId: input.clinicId,
              email: input.email,
            },
          ],
        },
        orderBy: { createdAt: 'asc' },
      });

      if (!existing) {
        throw error;
      }

      return this.prisma.user.update({
        where: { id: existing.id },
        data: {
          firebaseUid: input.firebaseUid,
          clinicId: input.clinicId,
          email: input.email,
          name: input.displayName ?? existing.name,
          phone: input.phone || existing.phone,
        },
      });
    }
  }

  private async resolveUserByUidOrEmail(firebaseUid: string, email: string): Promise<User | null> {
    const userByUid = await this.prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (userByUid) {
      return userByUid;
    }

    const userByEmail = await this.prisma.user.findFirst({
      where: { email },
      orderBy: { createdAt: 'asc' },
    });

    if (!userByEmail) {
      return null;
    }

    return this.prisma.user.update({
      where: { id: userByEmail.id },
      data: {
        firebaseUid,
      },
    });
  }

  private async upsertCustomerProfile(user: User): Promise<void> {
    if (user.role !== Role.customer) {
      return;
    }

    const phone = user.phone.trim();
    const safePhone = phone.length > 0 ? phone : `pending-${user.id.slice(-8)}`;

    const byUser = await this.prisma.customer.findUnique({
      where: { userId: user.id },
    });

    if (byUser) {
      await this.prisma.customer.update({
        where: { id: byUser.id },
        data: {
          clinicId: user.clinicId,
          name: user.name,
          phone: safePhone,
          email: user.email,
        },
      });
      return;
    }

    const filters: Prisma.CustomerWhereInput[] = [{ email: user.email }];
    if (phone.length > 0) {
      filters.push({ phone });
    }

    const candidate = await this.prisma.customer.findFirst({
      where: {
        clinicId: user.clinicId,
        userId: null,
        OR: filters,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (candidate) {
      await this.prisma.customer.update({
        where: { id: candidate.id },
        data: {
          userId: user.id,
          name: user.name,
          phone: safePhone,
          email: user.email,
        },
      });
      return;
    }

    await this.prisma.customer.create({
      data: {
        clinicId: user.clinicId,
        userId: user.id,
        name: user.name,
        phone: safePhone,
        email: user.email,
      },
    });
  }

  private buildOnboardingState(user: User, signInProvider: string): OnboardingState {
    const missingFields: string[] = [];

    if (!user.name || user.name.trim().length < 2) {
      missingFields.push('name');
    }

    if (!user.phone || user.phone.trim().length < 8 || user.phone.startsWith('pending-')) {
      missingFields.push('phone');
    }

    if (!user.clinicId) {
      missingFields.push('clinic');
    }

    const requiresOnboarding = user.role === Role.customer && missingFields.length > 0;
    const nextStep = requiresOnboarding
      ? signInProvider === 'google.com'
        ? '/customer/profile?onboarding=google'
        : '/customer/profile?onboarding=required'
      : null;

    return {
      required: requiresOnboarding,
      missingFields,
      nextStep,
    };
  }

  private toAuthUser(user: User): AuthUser {
    return {
      userId: user.id,
      clinicId: user.clinicId,
      firebaseUid: user.firebaseUid,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
    };
  }

  private async resolveClinicId(clinicSlug?: string, fallbackClinicId?: string): Promise<string> {
    if (clinicSlug && clinicSlug.trim().length > 0) {
      const normalized = this.normalizeClinicSlug(clinicSlug);
      const clinic = await this.prisma.clinic.findUnique({
        where: { slug: normalized },
      });
      if (!clinic) {
        throw new BadRequestException(`Clinic slug "${normalized}" not found`);
      }
      return clinic.id;
    }

    if (fallbackClinicId) {
      return fallbackClinicId;
    }

    const defaultSlug = this.normalizeClinicSlug(
      process.env.DEFAULT_CLINIC_SLUG?.trim() || 'default',
    );
    const defaultClinic = await this.prisma.clinic.upsert({
      where: { slug: defaultSlug },
      update: {},
      create: {
        slug: defaultSlug,
        name: 'PetHub Default Clinic',
      },
    });

    return defaultClinic.id;
  }

  private normalizeClinicSlug(input: string): string {
    const normalized = input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return normalized.length > 0 ? normalized : 'default';
  }

  private async verifyIdTokenWithTimeout(idToken: string) {
    const timeoutMs = Number(process.env.AUTH_VERIFY_TIMEOUT_MS ?? 12000);
    let timer: ReturnType<typeof setTimeout> | null = null;

    try {
      return await Promise.race([
        this.firebaseAdminService.verifyIdToken(idToken),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            reject(new ServiceUnavailableException('Firebase verification timeout'));
          }, timeoutMs);
        }),
      ]);
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  private isMissingClinicTableError(error: unknown): boolean {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2021'
    ) {
      const message = JSON.stringify(error);
      return message.includes('public.Clinic');
    }

    return false;
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    );
  }
}
