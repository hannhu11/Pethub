import { AppointmentStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class AppointmentQueryDto {
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}
