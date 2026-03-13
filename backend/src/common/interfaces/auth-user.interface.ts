import type { Role } from '@prisma/client';

export interface AuthUser {
  userId: string;
  clinicId: string;
  firebaseUid: string;
  email: string;
  name: string;
  phone: string;
  role: Role;
}
