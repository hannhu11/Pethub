import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpsertServiceDto } from './dto/upsert-service.dto';
import { UpsertProductDto } from './dto/upsert-product.dto';
import type { AuthUser } from '../common/interfaces/auth-user.interface';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listServices(currentUser: AuthUser) {
    return this.prisma.service.findMany({
      where: {
        clinicId: currentUser.clinicId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async listProducts(currentUser: AuthUser) {
    return this.prisma.product.findMany({
      where: {
        clinicId: currentUser.clinicId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async upsertService(currentUser: AuthUser, dto: UpsertServiceDto) {
    return this.prisma.service.upsert({
      where: {
        clinicId_code: {
          clinicId: currentUser.clinicId,
          code: dto.code,
        },
      },
      create: {
        clinicId: currentUser.clinicId,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        durationMin: dto.durationMin,
        price: dto.price,
      },
      update: {
        name: dto.name,
        description: dto.description,
        durationMin: dto.durationMin,
        price: dto.price,
      },
    });
  }

  async upsertProduct(currentUser: AuthUser, dto: UpsertProductDto) {
    return this.prisma.product.upsert({
      where: {
        clinicId_sku: {
          clinicId: currentUser.clinicId,
          sku: dto.sku,
        },
      },
      create: {
        clinicId: currentUser.clinicId,
        sku: dto.sku,
        name: dto.name,
        category: dto.category,
        description: dto.description,
        price: dto.price,
        stock: dto.stock,
      },
      update: {
        name: dto.name,
        category: dto.category,
        description: dto.description,
        price: dto.price,
        stock: dto.stock,
      },
    });
  }
}
