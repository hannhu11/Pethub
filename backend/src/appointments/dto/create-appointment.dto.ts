import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  customerId!: string;

  @IsString()
  petId!: string;

  @IsString()
  serviceId!: string;

  @IsDateString()
  appointmentAt!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  note?: string;
}
