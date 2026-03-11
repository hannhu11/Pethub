import { IsString, MinLength } from 'class-validator';

export class GenerateReminderDto {
  @IsString()
  @MinLength(1)
  petName!: string;

  @IsString()
  @MinLength(1)
  customerName!: string;

  @IsString()
  @MinLength(2)
  reminderType!: string;

  @IsString()
  @MinLength(2)
  clinicName!: string;
}
