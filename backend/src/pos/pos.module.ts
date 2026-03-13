import { Module } from '@nestjs/common';
import { PosService } from './pos.service';
import { PosController } from './pos.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [RealtimeModule, PaymentsModule],
  providers: [PosService],
  controllers: [PosController],
})
export class PosModule {}
