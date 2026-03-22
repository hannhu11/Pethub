import { IsISO8601, IsOptional, IsString, MinLength } from 'class-validator';

export class UpsertMedicalRecordDto {
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsOptional()
  @IsString()
  doctorName?: string;

  @IsOptional()
  @IsString()
  symptoms?: string;

  @IsString()
  @MinLength(2)
  diagnosis!: string;

  @IsString()
  @MinLength(2)
  treatment!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsISO8601()
  nextVisitAt?: string;

  @IsOptional()
  @IsISO8601()
  recordedAt?: string;
}
