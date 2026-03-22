import { Module } from '@nestjs/common';
import { PosService } from './pos.service';
import { PosController } from './pos.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { PaymentsModule } from '../payments/payments.module';
import { CustomerTierModule } from '../customer-tier/customer-tier.module';

@Module({
  imports: [RealtimeModule, PaymentsModule, CustomerTierModule],
  providers: [PosService],
  controllers: [PosController],
})
export class PosModule {}
