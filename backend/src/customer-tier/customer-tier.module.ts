import { Module } from '@nestjs/common';
import { CustomerTierService } from './customer-tier.service';

@Module({
  providers: [CustomerTierService],
  exports: [CustomerTierService],
})
export class CustomerTierModule {}
