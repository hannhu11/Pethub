import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
    const customerId = await this.resolveCustomerId(currentUser, dto.customerId);
    const [pet, service] = await Promise.all([
      this.prisma.pet.findUnique({
        where: { id: dto.petId },
        select: { id: true, customerId: true },
      }),
      this.prisma.service.findUnique({
        where: { id: dto.serviceId },
        select: { id: true },
      }),
    ]);

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    if (pet.customerId !== customerId) {
      throw new ForbiddenException('Pet does not belong to the selected customer profile');
    }

    if (!service) {
      throw new NotFoundException('Service not found');
    }

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
          customerId,
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
    if (currentUser.role !== 'manager') {
      throw new ForbiddenException('Only manager can update appointment workflow status');
    }

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

  async cancel(id: string, currentUser: AuthUser) {
    const current = await this.prisma.appointment.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException('Appointment not found');
    }

    if (current.status === AppointmentStatus.completed) {
      throw new BadRequestException('Cannot cancel completed appointment');
    }

    if (current.status === AppointmentStatus.cancelled) {
      return {
        appointment: await this.prisma.appointment.findUnique({
          where: { id },
          include: { customer: true, pet: true, service: true },
        }),
      };
    }

    if (currentUser.role === 'customer') {
      const customer = await this.prisma.customer.findUnique({
        where: { userId: currentUser.userId },
        select: { id: true },
      });

      if (!customer || customer.id !== current.customerId) {
        throw new ForbiddenException('You can only cancel your own appointment');
      }
    }

    const appointment = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.cancelled,
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
      status: AppointmentStatus.cancelled,
    });

    return { appointment };
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

  private async resolveCustomerId(currentUser: AuthUser, requestedCustomerId?: string): Promise<string> {
    if (currentUser.role === 'manager') {
      if (!requestedCustomerId) {
        throw new BadRequestException('customerId is required for manager booking creation');
      }
      return requestedCustomerId;
    }

    const customer = await this.prisma.customer.findUnique({
      where: { userId: currentUser.userId },
      select: { id: true },
    });
    if (!customer) {
      throw new ForbiddenException('Customer profile not found for current account');
    }

    return customer.id;
  }
}
