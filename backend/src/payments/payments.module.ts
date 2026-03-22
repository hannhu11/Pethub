import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { CustomerTierModule } from '../customer-tier/customer-tier.module';

@Module({
  imports: [RealtimeModule, CustomerTierModule],
  providers: [PaymentsService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
