import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { PetsQueryDto } from './dto/pets-query.dto';
import { UpsertPetDto } from './dto/upsert-pet.dto';

@Injectable()
export class PetsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(currentUser: AuthUser, query: PetsQueryDto) {
    const customerId = await this.resolveCustomerId(currentUser, query.customerId);

    return this.prisma.pet.findMany({
      where: customerId ? { customerId } : undefined,
      include: {
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
  }

  async getById(currentUser: AuthUser, id: string) {
    const pet = await this.prisma.pet.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    if (currentUser.role === 'customer') {
      const customer = await this.prisma.customer.findUnique({ where: { userId: currentUser.userId } });
      if (!customer || customer.id !== pet.customerId) {
        throw new ForbiddenException('Not allowed to access this pet profile');
      }
    }

    return pet;
  }

  async create(currentUser: AuthUser, dto: UpsertPetDto) {
    const customerId = await this.resolveCustomerId(currentUser, dto.customerId);

    if (!customerId) {
      throw new NotFoundException('Customer profile not found for pet creation');
    }

    return this.prisma.pet.create({
      data: {
        customerId,
        imageUrl: dto.imageUrl,
        name: dto.name,
        species: dto.species,
        breed: dto.breed,
        gender: dto.gender,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        weightKg: dto.weightKg,
        coatColor: dto.coatColor,
        bloodType: dto.bloodType,
        neutered: dto.neutered,
        microchipId: dto.microchipId,
        specialNotes: dto.specialNotes,
      },
      include: {
        customer: true,
      },
    });
  }

  async update(currentUser: AuthUser, id: string, dto: UpsertPetDto) {
    const existing = await this.prisma.pet.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Pet not found');
    }

    if (currentUser.role === 'customer') {
      const customer = await this.prisma.customer.findUnique({ where: { userId: currentUser.userId } });
      if (!customer || customer.id !== existing.customerId) {
        throw new ForbiddenException('Not allowed to edit this pet profile');
      }
    }

    const targetCustomerId =
      currentUser.role === 'manager' && dto.customerId ? dto.customerId : existing.customerId;

    return this.prisma.pet.update({
      where: { id },
      data: {
        customerId: targetCustomerId,
        imageUrl: dto.imageUrl ?? existing.imageUrl,
        name: dto.name,
        species: dto.species,
        breed: dto.breed,
        gender: dto.gender,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : existing.dateOfBirth,
        weightKg: dto.weightKg,
        coatColor: dto.coatColor,
        bloodType: dto.bloodType,
        neutered: dto.neutered,
        microchipId: dto.microchipId,
        specialNotes: dto.specialNotes,
      },
      include: {
        customer: true,
      },
    });
  }

  private async resolveCustomerId(currentUser: AuthUser, candidateCustomerId?: string) {
    if (currentUser.role === 'manager') {
      return candidateCustomerId;
    }

    const customer = await this.prisma.customer.findUnique({
      where: {
        userId: currentUser.userId,
      },
    });

    return customer?.id;
  }
}
