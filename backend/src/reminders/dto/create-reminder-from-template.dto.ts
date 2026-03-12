import { ReminderChannel } from '@prisma/client';
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateReminderFromTemplateDto {
  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsString()
  templateName?: string;

  @IsString()
  customerId!: string;

  @IsString()
  petId!: string;

  @IsEnum(ReminderChannel)
  channel!: ReminderChannel;

  @IsOptional()
  @IsDateString()
  scheduleAt?: string;

  @IsOptional()
  @IsBoolean()
  sendNow?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(4)
  overrideMessage?: string;
}
