import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpsertServiceDto } from './dto/upsert-service.dto';
import { UpsertProductDto } from './dto/upsert-product.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listServices() {
    return this.prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async listProducts() {
    return this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async upsertService(dto: UpsertServiceDto) {
    return this.prisma.service.upsert({
      where: { code: dto.code },
      create: {
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

  async upsertProduct(dto: UpsertProductDto) {
    return this.prisma.product.upsert({
      where: { sku: dto.sku },
      create: {
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
