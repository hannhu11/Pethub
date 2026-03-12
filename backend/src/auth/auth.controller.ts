import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SyncFirebaseDto } from './dto/sync-firebase.dto';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sync-firebase')
  async syncFirebase(@Body() dto: SyncFirebaseDto) {
    const user = await this.authService.syncFirebase(dto);
    return { user };
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: AuthUser | null) {
    return { user: await this.authService.getMe(user) };
  }
}
