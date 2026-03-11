import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CustomersQueryDto } from './dto/customers-query.dto';

@Controller('customers')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Roles('manager')
  async list(@Query() query: CustomersQueryDto) {
    return this.customersService.list(query);
  }

  @Get(':id')
  @Roles('manager')
  async getById(@Param('id') id: string) {
    return this.customersService.getById(id);
  }
}
