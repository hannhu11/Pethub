import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('users')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('manager')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async list() {
    return this.usersService.list();
  }
}
