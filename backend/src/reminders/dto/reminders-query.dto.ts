import { ReminderStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class RemindersQueryDto {
  @IsOptional()
  @IsEnum(ReminderStatus)
  status?: ReminderStatus;
}
