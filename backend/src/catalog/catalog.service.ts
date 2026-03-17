import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpsertServiceDto } from './dto/upsert-service.dto';
import { UpsertProductDto } from './dto/upsert-product.dto';
import type { AuthUser } from '../common/interfaces/auth-user.interface';

function normalizeNullableText(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

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
    const imageUrl = normalizeNullableText(dto.imageUrl);
    const iconName = normalizeNullableText(dto.iconName);
    const updateData: {
      name: string;
      description?: string;
      durationMin: number;
      price: number;
      imageUrl?: string | null;
      iconName?: string | null;
    } = {
      name: dto.name,
      description: dto.description,
      durationMin: dto.durationMin,
      price: dto.price,
    };

    if (dto.imageUrl !== undefined) {
      updateData.imageUrl = imageUrl;
    }
    if (dto.iconName !== undefined) {
      updateData.iconName = iconName;
    }

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
        imageUrl,
        iconName,
        durationMin: dto.durationMin,
        price: dto.price,
      },
      update: updateData,
    });
  }

  async upsertProduct(currentUser: AuthUser, dto: UpsertProductDto) {
    const imageUrl = normalizeNullableText(dto.imageUrl);
    const iconName = normalizeNullableText(dto.iconName);
    const updateData: {
      name: string;
      category?: string;
      description?: string;
      price: number;
      stock: number;
      imageUrl?: string | null;
      iconName?: string | null;
    } = {
      name: dto.name,
      category: dto.category,
      description: dto.description,
      price: dto.price,
      stock: dto.stock,
    };

    if (dto.imageUrl !== undefined) {
      updateData.imageUrl = imageUrl;
    }
    if (dto.iconName !== undefined) {
      updateData.iconName = iconName;
    }

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
        imageUrl,
        iconName,
        price: dto.price,
        stock: dto.stock,
      },
      update: updateData,
    });
  }
}
