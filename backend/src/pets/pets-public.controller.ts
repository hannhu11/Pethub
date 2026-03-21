import { Controller, Get, Param } from '@nestjs/common';
import { PetsService } from './pets.service';

@Controller('pets/public')
export class PetsPublicController {
  constructor(private readonly petsService: PetsService) {}

  @Get(':id')
  async getPublicProfile(@Param('id') id: string) {
    return this.petsService.getPublicPetProfile(id);
  }
}
