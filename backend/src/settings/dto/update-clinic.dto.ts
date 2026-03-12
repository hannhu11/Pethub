import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateClinicDto {
  @IsString()
  @MinLength(2)
  clinicName!: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsString()
  @MinLength(6)
  phone!: string;

  @IsString()
  @MinLength(6)
  address!: string;

  @IsOptional()
  @IsString()
  invoiceNote?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsString()
  @MinLength(6)
  confirmPassword!: string;
}
