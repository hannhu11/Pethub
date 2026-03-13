import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PetsService } from './pets.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { PetsQueryDto } from './dto/pets-query.dto';
import { UpsertPetDto } from './dto/upsert-pet.dto';
import { UpsertMedicalRecordDto } from './dto/upsert-medical-record.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('pets')
@UseGuards(FirebaseAuthGuard)
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser | null, @Query() query: PetsQueryDto) {
    if (!user) {
      return [];
    }

    return this.petsService.list(user, query);
  }

  @Get(':id')
  async getById(@CurrentUser() user: AuthUser | null, @Param('id') id: string) {
    if (!user) {
      return null;
    }

    return this.petsService.getById(user, id);
  }

  @Post()
  async create(@CurrentUser() user: AuthUser | null, @Body() dto: UpsertPetDto) {
    if (!user) {
      return null;
    }

    return this.petsService.create(user, dto);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: AuthUser | null,
    @Param('id') id: string,
    @Body() dto: UpsertPetDto,
  ) {
    if (!user) {
      return null;
    }

    return this.petsService.update(user, id, dto);
  }

  @Get(':petId/medical-records')
  async listMedicalRecords(@CurrentUser() user: AuthUser | null, @Param('petId') petId: string) {
    if (!user) {
      return [];
    }
    return this.petsService.listMedicalRecords(user, petId);
  }

  @Post(':petId/medical-records')
  @UseGuards(RolesGuard)
  @Roles('manager')
  async createMedicalRecord(
    @CurrentUser() user: AuthUser | null,
    @Param('petId') petId: string,
    @Body() dto: UpsertMedicalRecordDto,
  ) {
    if (!user) {
      return null;
    }
    return this.petsService.createMedicalRecord(user, petId, dto);
  }

  @Put(':petId/medical-records/:recordId')
  @UseGuards(RolesGuard)
  @Roles('manager')
  async updateMedicalRecord(
    @CurrentUser() user: AuthUser | null,
    @Param('petId') petId: string,
    @Param('recordId') recordId: string,
    @Body() dto: UpsertMedicalRecordDto,
  ) {
    if (!user) {
      return null;
    }
    return this.petsService.updateMedicalRecord(user, petId, recordId, dto);
  }

  @Delete(':petId/medical-records/:recordId')
  @UseGuards(RolesGuard)
  @Roles('manager')
  async deleteMedicalRecord(
    @CurrentUser() user: AuthUser | null,
    @Param('petId') petId: string,
    @Param('recordId') recordId: string,
  ) {
    if (!user) {
      return null;
    }
    return this.petsService.deleteMedicalRecord(user, petId, recordId);
  }

  @Get(':petId/digital-card')
  async getDigitalCard(@CurrentUser() user: AuthUser | null, @Param('petId') petId: string) {
    if (!user) {
      return null;
    }
    return this.petsService.getDigitalCard(user, petId);
  }

  @Post(':petId/digital-card/regenerate')
  @UseGuards(RolesGuard)
  @Roles('manager')
  async regenerateDigitalCard(
    @CurrentUser() user: AuthUser | null,
    @Param('petId') petId: string,
    @Body() body: { note?: string },
  ) {
    if (!user) {
      return null;
    }
    return this.petsService.regenerateDigitalCard(user, petId, body?.note);
  }
}
