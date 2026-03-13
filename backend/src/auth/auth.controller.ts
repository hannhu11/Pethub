import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SyncFirebaseDto } from './dto/sync-firebase.dto';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sync-firebase')
  async syncFirebase(@Body() dto: SyncFirebaseDto) {
    return this.authService.syncFirebase(dto);
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: AuthUser | null) {
    return this.authService.getMe(user);
  }

  @UseGuards(FirebaseAuthGuard)
  @Post('onboarding/complete')
  async completeOnboarding(
    @CurrentUser() user: AuthUser | null,
    @Body() dto: CompleteOnboardingDto,
  ) {
    return this.authService.completeOnboarding(user, dto);
  }
}
