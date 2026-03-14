import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  emailBooking?: boolean;

  @IsOptional()
  @IsBoolean()
  emailReminder?: boolean;

  @IsOptional()
  @IsBoolean()
  smsBooking?: boolean;

  @IsOptional()
  @IsBoolean()
  smsReminder?: boolean;

  @IsOptional()
  @IsBoolean()
  dailyReport?: boolean;

  @IsOptional()
  @IsBoolean()
  weeklyReport?: boolean;
}
