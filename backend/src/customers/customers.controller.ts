import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CustomersQueryDto } from './dto/customers-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerSegmentSettingsDto } from './dto/update-customer-segment-settings.dto';

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

  @Post()
  @Roles('manager')
  async create(@CurrentUser() user: AuthUser | null, @Body() dto: CreateCustomerDto) {
    if (!user) {
      return null;
    }
    return this.customersService.create(user, dto);
  }

  @Get('segment-settings')
  @Roles('manager')
  async getSegmentSettings(@CurrentUser() user: AuthUser | null) {
    if (!user) {
      return null;
    }
    return this.customersService.getSegmentSettings(user);
  }

  @Put('segment-settings')
  @Roles('manager')
  async updateSegmentSettings(
    @CurrentUser() user: AuthUser | null,
    @Body() dto: UpdateCustomerSegmentSettingsDto,
  ) {
    if (!user) {
      return null;
    }
    return this.customersService.updateSegmentSettings(user, dto);
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
