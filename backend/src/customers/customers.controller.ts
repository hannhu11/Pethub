import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CustomersQueryDto } from './dto/customers-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';

@Controller('customers')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Roles('manager')
  async list(@CurrentUser() user: AuthUser | null, @Query() query: CustomersQueryDto) {
    if (!user) {
      return [];
    }
    return this.customersService.list(user, query);
  }

  @Get(':id')
  @Roles('manager')
  async getById(@CurrentUser() user: AuthUser | null, @Param('id') id: string) {
    if (!user) {
      return null;
    }
    return this.customersService.getById(user, id);
  }
}
