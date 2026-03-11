import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Role, type User } from '@prisma/client';
import type { DecodedIdToken } from 'firebase-admin/auth';
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
    const inferredRole = this.resolveRole(decoded, dto.role);

    const user = await this.prisma.user.upsert({
      where: { firebaseUid: decoded.uid },
      create: {
        firebaseUid: decoded.uid,
        email,
        role: inferredRole,
        name: dto.name ?? decoded.name ?? email.split('@')[0] ?? 'PetHub User',
        phone: dto.phone ?? '',
      },
      update: {
        email,
        role: inferredRole,
        name: dto.name ?? decoded.name ?? undefined,
        phone: dto.phone ?? undefined,
      },
    });

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

    const user = await this.prisma.user.findUnique({ where: { firebaseUid: decoded.uid } });
    if (!user) {
      throw new UnauthorizedException('User not synchronized. Call /api/auth/sync-firebase first.');
    }

    return this.toAuthUser(user);
  }

  private resolveRole(decoded: DecodedIdToken, requestedRole?: Role): Role {
    if (requestedRole) {
      return requestedRole;
    }

    const claimRole = decoded.role;
    if (claimRole === 'manager' || claimRole === 'customer') {
      return claimRole;
    }

    const email = decoded.email ?? '';
    return email.endsWith('@manager.pethub.vn') ? Role.manager : Role.customer;
  }

  private toAuthUser(user: User): AuthUser {
    return {
      userId: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
