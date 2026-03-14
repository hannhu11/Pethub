import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';

@Controller('settings')
@UseGuards(FirebaseAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings(@CurrentUser() user: AuthUser | null) {
    if (!user) {
      return null;
    }
    return this.settingsService.getSettings(user);
  }

  @Put('profile')
  async updateProfile(@CurrentUser() user: AuthUser | null, @Body() dto: UpdateProfileDto) {
    if (!user) {
      return null;
    }
    return this.settingsService.updateProfile(user, dto);
  }

  @Put('clinic')
  async updateClinic(@CurrentUser() user: AuthUser | null, @Body() dto: UpdateClinicDto) {
    if (!user) {
      return null;
    }
    return this.settingsService.updateClinic(user, dto);
  }

  @Put('password')
  async updatePassword(@CurrentUser() user: AuthUser | null, @Body() dto: UpdatePasswordDto) {
    if (!user) {
      return null;
    }
    return this.settingsService.updatePassword(user, dto);
  }

  @Get('notifications')
  async getNotificationSettings(@CurrentUser() user: AuthUser | null) {
    if (!user) {
      return null;
    }
    return this.settingsService.getNotificationSettings(user);
  }

  @Put('notifications')
  async updateNotificationSettings(
    @CurrentUser() user: AuthUser | null,
    @Body() dto: UpdateNotificationSettingsDto,
  ) {
    if (!user) {
      return null;
    }
    return this.settingsService.updateNotificationSettings(user, dto);
  }
}
