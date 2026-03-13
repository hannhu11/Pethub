import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { AuthUser } from '../common/interfaces/auth-user.interface';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(currentUser: AuthUser) {
    return this.prisma.user.findMany({
      where: {
        clinicId: currentUser.clinicId,
      },
      select: {
        id: true,
        clinicId: true,
        firebaseUid: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
