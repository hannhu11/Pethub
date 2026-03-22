import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ClinicalNotesPetContextDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  species?: string;

  @IsOptional()
  @IsString()
  breed?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  weightKg?: number;
}

export class ClinicalNotesRequestDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  rawNotes!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ClinicalNotesPetContextDto)
  petContext?: ClinicalNotesPetContextDto;
}
