import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PetsService } from './pets.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { PetsQueryDto } from './dto/pets-query.dto';
import { UpsertPetDto } from './dto/upsert-pet.dto';

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
}
