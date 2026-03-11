import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, PaymentStatus, Prisma } from '@prisma/client';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { PrismaService } from '../database/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { AppointmentQueryDto } from './dto/appointment-query.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async list(currentUser: AuthUser, query: AppointmentQueryDto) {
    const where: Prisma.AppointmentWhereInput = {
      ...(query.status ? { status: query.status } : {}),
    };

    if (currentUser.role === 'customer') {
      const customer = await this.prisma.customer.findUnique({ where: { userId: currentUser.userId } });
      if (!customer) {
        return [];
      }
      where.customerId = customer.id;
    }

    return this.prisma.appointment.findMany({
      where,
      include: {
        customer: true,
        pet: true,
        service: true,
      },
      orderBy: {
        appointmentAt: 'desc',
      },
      take: 300,
    });
  }

  async create(dto: CreateAppointmentDto, currentUser: AuthUser) {
    const slot = new Date(dto.appointmentAt);

    return this.prisma.$transaction(async (tx) => {
      const collision = await tx.appointment.findFirst({
        where: {
          appointmentAt: slot,
          status: {
            in: [AppointmentStatus.pending, AppointmentStatus.confirmed],
          },
        },
      });

      if (collision) {
        throw new ConflictException('Khung giờ này vừa có người đặt. Vui lòng chọn giờ khác.');
      }

      const appointment = await tx.appointment.create({
        data: {
          customerId: dto.customerId,
          petId: dto.petId,
          serviceId: dto.serviceId,
          appointmentAt: slot,
          note: dto.note,
          status: AppointmentStatus.pending,
          paymentStatus: PaymentStatus.unpaid,
          managerId: currentUser.role === 'manager' ? currentUser.userId : null,
        },
        include: {
          customer: true,
          pet: true,
          service: true,
        },
      });

      this.realtimeService.emitAppointmentUpdated({
        type: 'created',
        appointment,
      });

      return appointment;
    });
  }

  async updateStatus(id: string, dto: UpdateAppointmentStatusDto, currentUser: AuthUser) {
    const current = await this.prisma.appointment.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException('Appointment not found');
    }

    if (!this.canTransition(current.status, dto.status)) {
      throw new BadRequestException(`Invalid status transition: ${current.status} -> ${dto.status}`);
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: dto.status,
        managerId: currentUser.role === 'manager' ? currentUser.userId : current.managerId,
      },
      include: {
        customer: true,
        pet: true,
        service: true,
      },
    });

    this.realtimeService.emitAppointmentUpdated({
      type: 'status',
      appointmentId: id,
      status: dto.status,
    });

    return {
      appointment: updated,
      requiresPosCheckout:
        updated.status === AppointmentStatus.completed &&
        updated.paymentStatus === PaymentStatus.unpaid,
    };
  }

  private canTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
    if (from === to) {
      return true;
    }

    const transitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      pending: [AppointmentStatus.confirmed, AppointmentStatus.cancelled],
      confirmed: [AppointmentStatus.completed, AppointmentStatus.cancelled],
      completed: [],
      cancelled: [],
    };

    return transitions[from].includes(to);
  }
}
