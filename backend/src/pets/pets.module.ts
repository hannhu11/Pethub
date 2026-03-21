import { Module } from '@nestjs/common';
import { PetsService } from './pets.service';
import { PetsController } from './pets.controller';
import { PetsPublicController } from './pets-public.controller';

@Module({
  providers: [PetsService],
  controllers: [PetsController, PetsPublicController],
  exports: [PetsService],
})
export class PetsModule {}
