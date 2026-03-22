import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { PaymentsModule } from '../payments/payments.module';
import { CustomerTierModule } from '../customer-tier/customer-tier.module';

@Module({
  imports: [PaymentsModule, CustomerTierModule],
  providers: [CustomersService],
  controllers: [CustomersController],
  exports: [CustomersService],
})
export class CustomersModule {}
