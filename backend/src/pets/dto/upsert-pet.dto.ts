import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpsertPetDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsString()
  name!: string;

  @IsString()
  species!: string;

  @IsOptional()
  @IsString()
  breed?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weightKg?: number;

  @IsOptional()
  @IsString()
  coatColor?: string;

  @IsOptional()
  @IsString()
  bloodType?: string;

  @IsOptional()
  @IsString()
  neutered?: string;

  @IsOptional()
  @IsString()
  microchipId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(55)
  specialNotes?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
