import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Prisma, Role, type User } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { FirebaseAdminService } from './firebase-admin.service';
import { SyncFirebaseDto } from './dto/sync-firebase.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseAdminService: FirebaseAdminService,
  ) {}

  async syncFirebase(dto: SyncFirebaseDto): Promise<AuthUser> {
    const decoded = await this.firebaseAdminService.verifyIdToken(dto.idToken);

    const email = decoded.email ?? `${decoded.uid}@pethub.vn`;
    const normalizedPhone = dto.phone ?? decoded.phone_number ?? '';

    const userByUid = await this.prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });

    const user = userByUid
      ? await this.prisma.user.update({
          where: { id: userByUid.id },
          data: {
            email,
            name: dto.name ?? decoded.name ?? userByUid.name,
            phone: normalizedPhone || userByUid.phone,
          },
        })
      : await this.upsertByEmailFallback(decoded.uid, email, normalizedPhone, dto.name ?? decoded.name ?? null);

    await this.linkCustomerProfile(user);

    return this.toAuthUser(user);
  }

  async getMe(currentUser: AuthUser | null): Promise<AuthUser> {
    if (!currentUser) {
      throw new UnauthorizedException('Missing authenticated user context');
    }

    const user = await this.prisma.user.findUnique({ where: { id: currentUser.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toAuthUser(user);
  }

  async verifyAndResolveUser(idToken: string): Promise<AuthUser> {
    const decoded = await this.firebaseAdminService.verifyIdToken(idToken);

    const email = decoded.email ?? `${decoded.uid}@pethub.vn`;
    const user = await this.resolveUserByUidOrEmail(decoded.uid, email);
    if (!user) {
      throw new UnauthorizedException('User not synchronized. Call /api/auth/sync-firebase first.');
    }

    await this.linkCustomerProfile(user);

    return this.toAuthUser(user);
  }

  private async upsertByEmailFallback(
    firebaseUid: string,
    email: string,
    phone: string,
    displayName: string | null,
  ): Promise<User> {
    const userByEmail = await this.prisma.user.findUnique({
      where: { email },
    });

    if (userByEmail) {
      return this.prisma.user.update({
        where: { id: userByEmail.id },
        data: {
          firebaseUid,
          name: displayName ?? userByEmail.name,
          phone: phone || userByEmail.phone,
        },
      });
    }

    return this.prisma.user.create({
      data: {
        firebaseUid,
        email,
        role: Role.customer,
        name: displayName ?? email.split('@')[0] ?? 'PetHub User',
        phone,
      },
    });
  }

  private async resolveUserByUidOrEmail(firebaseUid: string, email: string): Promise<User | null> {
    const userByUid = await this.prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (userByUid) {
      return userByUid;
    }

    const userByEmail = await this.prisma.user.findUnique({
      where: { email },
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

  private async linkCustomerProfile(user: User): Promise<void> {
    if (user.role !== Role.customer) {
      return;
    }

    const filters: Prisma.CustomerWhereInput[] = [{ email: user.email }];
    if (user.phone) {
      filters.push({ phone: user.phone });
    }

    const candidate = await this.prisma.customer.findFirst({
      where: {
        AND: [{ userId: null }, { OR: filters }],
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!candidate) {
      return;
    }

    await this.prisma.customer.update({
      where: { id: candidate.id },
      data: { userId: user.id },
    });
  }

  private toAuthUser(user: User): AuthUser {
    return {
      userId: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
    };
  }
}
