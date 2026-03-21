import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { PetsQueryDto } from './dto/pets-query.dto';
import { UpsertPetDto } from './dto/upsert-pet.dto';
import { UpsertMedicalRecordDto } from './dto/upsert-medical-record.dto';
import { formatPetDisplayId } from './pet-id.util';

@Injectable()
export class PetsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(currentUser: AuthUser, query: PetsQueryDto) {
    let customerId: string | undefined;

    if (currentUser.role === 'manager') {
      if (query.customerId) {
        const customer = await this.prisma.customer.findFirst({
          where: {
            id: query.customerId,
            clinicId: currentUser.clinicId,
          },
          select: { id: true },
        });
        if (!customer) {
          throw new NotFoundException('Customer not found in current clinic');
        }
        customerId = customer.id;
      }
    } else {
      customerId = await this.resolveCustomerId(currentUser, query.customerId);
    }

    return this.prisma.pet.findMany({
      where: {
        clinicId: currentUser.clinicId,
        ...(customerId ? { customerId } : {}),
      },
      include: {
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
  }

  async getById(currentUser: AuthUser, id: string) {
    const pet = await this.prisma.pet.findFirst({
      where: {
        id,
        clinicId: currentUser.clinicId,
      },
      include: {
        customer: true,
      },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    await this.ensurePetAccess(currentUser, pet.customerId);
    return pet;
  }

  async create(currentUser: AuthUser, dto: UpsertPetDto) {
    const customerId = await this.resolveCustomerId(currentUser, dto.customerId);
    if (!customerId) {
      throw new NotFoundException('Customer profile not found for pet creation');
    }

    return this.prisma.pet.create({
      data: {
        clinicId: currentUser.clinicId,
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
    const existing = await this.prisma.pet.findFirst({
      where: {
        id,
        clinicId: currentUser.clinicId,
      },
    });
    if (!existing) {
      throw new NotFoundException('Pet not found');
    }

    await this.ensurePetAccess(currentUser, existing.customerId);

    const targetCustomerId =
      currentUser.role === 'manager' && dto.customerId ? dto.customerId : existing.customerId;

    if (currentUser.role === 'manager' && dto.customerId) {
      const targetCustomer = await this.prisma.customer.findFirst({
        where: {
          id: dto.customerId,
          clinicId: currentUser.clinicId,
        },
      });
      if (!targetCustomer) {
        throw new NotFoundException('Target customer not found in current clinic');
      }
    }

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

  async listMedicalRecords(currentUser: AuthUser, petId: string) {
    const pet = await this.getPetOrThrow(currentUser, petId);
    await this.ensurePetAccess(currentUser, pet.customerId);

    return this.prisma.medicalRecord.findMany({
      where: {
        clinicId: currentUser.clinicId,
        petId: pet.id,
      },
      orderBy: { recordedAt: 'desc' },
    });
  }

  async createMedicalRecord(currentUser: AuthUser, petId: string, dto: UpsertMedicalRecordDto) {
    const pet = await this.getPetOrThrow(currentUser, petId);
    await this.ensurePetAccess(currentUser, pet.customerId);

    await this.assertAppointmentConsistency(currentUser, pet, dto.appointmentId);

    const record = await this.prisma.medicalRecord.create({
      data: {
        clinicId: currentUser.clinicId,
        petId: pet.id,
        customerId: pet.customerId,
        appointmentId: dto.appointmentId,
        doctorName: dto.doctorName,
        diagnosis: dto.diagnosis,
        treatment: dto.treatment,
        notes: dto.notes,
        nextVisitAt: dto.nextVisitAt ? new Date(dto.nextVisitAt) : null,
        recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : new Date(),
        createdById: currentUser.userId,
      },
    });

    await this.prisma.pet.update({
      where: { id: pet.id },
      data: {
        lastCheckupAt: record.recordedAt,
      },
    });

    return record;
  }

  async updateMedicalRecord(
    currentUser: AuthUser,
    petId: string,
    recordId: string,
    dto: UpsertMedicalRecordDto,
  ) {
    const pet = await this.getPetOrThrow(currentUser, petId);
    await this.ensurePetAccess(currentUser, pet.customerId);

    const existing = await this.prisma.medicalRecord.findFirst({
      where: {
        id: recordId,
        petId,
        clinicId: currentUser.clinicId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Medical record not found');
    }

    await this.assertAppointmentConsistency(currentUser, pet, dto.appointmentId);

    const record = await this.prisma.medicalRecord.update({
      where: { id: recordId },
      data: {
        appointmentId: dto.appointmentId,
        doctorName: dto.doctorName,
        diagnosis: dto.diagnosis,
        treatment: dto.treatment,
        notes: dto.notes,
        nextVisitAt: dto.nextVisitAt ? new Date(dto.nextVisitAt) : null,
        recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : existing.recordedAt,
        createdById: currentUser.userId,
      },
    });

    await this.prisma.pet.update({
      where: { id: pet.id },
      data: {
        lastCheckupAt: record.recordedAt,
      },
    });

    return record;
  }

  async deleteMedicalRecord(currentUser: AuthUser, petId: string, recordId: string) {
    const pet = await this.getPetOrThrow(currentUser, petId);
    await this.ensurePetAccess(currentUser, pet.customerId);

    const existing = await this.prisma.medicalRecord.findFirst({
      where: {
        id: recordId,
        petId,
        clinicId: currentUser.clinicId,
      },
    });
    if (!existing) {
      throw new NotFoundException('Medical record not found');
    }

    await this.prisma.medicalRecord.delete({ where: { id: recordId } });
    return { success: true };
  }

  async getDigitalCard(currentUser: AuthUser, petId: string) {
    const pet = await this.prisma.pet.findFirst({
      where: {
        id: petId,
        clinicId: currentUser.clinicId,
      },
      include: {
        customer: true,
      },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }
    await this.ensurePetAccess(currentUser, pet.customerId);

    const [records, regenEvents] = await Promise.all([
      this.prisma.medicalRecord.findMany({
        where: {
          clinicId: currentUser.clinicId,
          petId,
        },
        orderBy: { recordedAt: 'desc' },
        take: 20,
      }),
      this.prisma.digitalCardEvent.findMany({
        where: {
          clinicId: currentUser.clinicId,
          petId,
          action: 'regenerate',
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      }),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      pet: {
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        gender: pet.gender,
        dateOfBirth: pet.dateOfBirth,
        weightKg: pet.weightKg,
        coatColor: pet.coatColor,
        bloodType: pet.bloodType,
        neutered: pet.neutered,
        microchipId: pet.microchipId,
        specialNotes: pet.specialNotes,
        imageUrl: pet.imageUrl,
        lastCheckupAt: pet.lastCheckupAt,
      },
      owner: {
        id: pet.customer.id,
        name: pet.customer.name,
        phone: pet.customer.phone,
        email: pet.customer.email,
        segment: pet.customer.segment,
        totalSpent: pet.customer.totalSpent,
        totalVisits: pet.customer.totalVisits,
        lastVisitAt: pet.customer.lastVisitAt,
      },
      medical: {
        total: records.length,
        latest: records[0] ?? null,
        items: records,
      },
      version: {
        lastRegeneratedAt: regenEvents[0]?.createdAt ?? null,
      },
    };
  }

  async regenerateDigitalCard(currentUser: AuthUser, petId: string, note?: string) {
    const pet = await this.getPetOrThrow(currentUser, petId);
    await this.ensurePetAccess(currentUser, pet.customerId);

    await this.prisma.digitalCardEvent.create({
      data: {
        clinicId: currentUser.clinicId,
        petId,
        actorId: currentUser.userId,
        action: 'regenerate',
        note: note?.trim() || 'manual-regenerate',
      },
    });

    return this.getDigitalCard(currentUser, petId);
  }

  async getPublicPetProfile(id: string) {
    const pet = await this.prisma.pet.findUnique({
      where: { id },
      select: {
        id: true,
        clinicId: true,
        name: true,
        species: true,
        breed: true,
        gender: true,
        dateOfBirth: true,
        weightKg: true,
        coatColor: true,
        bloodType: true,
        neutered: true,
        microchipId: true,
        imageUrl: true,
        specialNotes: true,
        lastCheckupAt: true,
        clinic: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    const [medicalItems, clinicSettings] = await Promise.all([
      this.prisma.medicalRecord.findMany({
        where: {
          clinicId: pet.clinicId,
          petId: pet.id,
        },
        orderBy: { recordedAt: 'desc' },
        take: 5,
        select: {
          diagnosis: true,
          treatment: true,
          recordedAt: true,
          nextVisitAt: true,
        },
      }),
      this.prisma.clinicSettings.findUnique({
        where: {
          clinicId: pet.clinicId,
        },
        select: {
          clinicName: true,
          phone: true,
        },
      }),
    ]);

    return {
      displayPetId: formatPetDisplayId(pet.id),
      pet: {
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        gender: pet.gender,
        dateOfBirth: pet.dateOfBirth,
        weightKg: pet.weightKg,
        coatColor: pet.coatColor,
        bloodType: pet.bloodType,
        neutered: pet.neutered,
        microchipId: pet.microchipId,
        imageUrl: pet.imageUrl,
        specialNotes: pet.specialNotes,
        lastCheckupAt: pet.lastCheckupAt,
      },
      medical: {
        latest: medicalItems[0] ?? null,
        items: medicalItems,
      },
      clinic: {
        name: clinicSettings?.clinicName || pet.clinic.name || 'PetHub',
        phone: clinicSettings?.phone || pet.clinic.phone || null,
      },
    };
  }

  private async resolveCustomerId(currentUser: AuthUser, candidateCustomerId?: string) {
    if (currentUser.role === 'manager') {
      if (!candidateCustomerId) {
        throw new BadRequestException('customerId is required for manager pet operation');
      }
      const customer = await this.prisma.customer.findFirst({
        where: {
          id: candidateCustomerId,
          clinicId: currentUser.clinicId,
        },
      });
      if (!customer) {
        throw new NotFoundException('Customer not found in current clinic');
      }
      return customer.id;
    }

    const customer = await this.prisma.customer.findFirst({
      where: {
        userId: currentUser.userId,
        clinicId: currentUser.clinicId,
      },
    });

    return customer?.id;
  }

  private async ensurePetAccess(currentUser: AuthUser, customerId: string) {
    if (currentUser.role !== 'customer') {
      return;
    }

    const customer = await this.prisma.customer.findFirst({
      where: {
        userId: currentUser.userId,
        clinicId: currentUser.clinicId,
      },
    });
    if (!customer || customer.id !== customerId) {
      throw new ForbiddenException('Not allowed to access this pet profile');
    }
  }

  private async getPetOrThrow(currentUser: AuthUser, petId: string) {
    const pet = await this.prisma.pet.findFirst({
      where: {
        id: petId,
        clinicId: currentUser.clinicId,
      },
    });
    if (!pet) {
      throw new NotFoundException('Pet not found');
    }
    return pet;
  }

  private async assertAppointmentConsistency(
    currentUser: AuthUser,
    pet: { id: string; customerId: string },
    appointmentId?: string,
  ) {
    if (!appointmentId) {
      return;
    }

    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        clinicId: currentUser.clinicId,
      },
      select: {
        id: true,
        petId: true,
        customerId: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    if (appointment.petId !== pet.id || appointment.customerId !== pet.customerId) {
      throw new BadRequestException('Appointment does not belong to selected pet/customer');
    }
  }
}
