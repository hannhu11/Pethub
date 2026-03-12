import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { FirebaseAdminService } from './firebase-admin.service';

@Module({
  imports: [ConfigModule],
  providers: [AuthService, FirebaseAdminService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
