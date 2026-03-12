import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { FirebaseAdminService } from './firebase-admin.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [AuthService, FirebaseAdminService, FirebaseAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, FirebaseAuthGuard],
})
export class AuthModule {}
