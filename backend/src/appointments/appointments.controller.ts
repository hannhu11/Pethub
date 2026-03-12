import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { AppointmentQueryDto } from './dto/appointment-query.dto';

@Controller('appointments')
@UseGuards(FirebaseAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser | null, @Query() query: AppointmentQueryDto) {
    if (!user) {
      return [];
    }

    return this.appointmentsService.list(user, query);
  }

  @Post()
  async create(@CurrentUser() user: AuthUser | null, @Body() dto: CreateAppointmentDto) {
    if (!user) {
      return null;
    }

    return this.appointmentsService.create(dto, user);
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: AuthUser | null,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    if (!user) {
      return null;
    }

    return this.appointmentsService.updateStatus(id, dto, user);
  }
}
