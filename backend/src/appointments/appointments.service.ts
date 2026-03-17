import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, NotificationTarget, PaymentStatus, Prisma } from '@prisma/client';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { PrismaService } from '../database/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { AppointmentQueryDto } from './dto/appointment-query.dto';
import { PaymentsService } from '../payments/payments.service';

type AppointmentListItem = Prisma.AppointmentGetPayload<{
  include: {
    customer: true;
    pet: true;
    service: true;
  };
}>;

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeService: RealtimeService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async list(currentUser: AuthUser, query: AppointmentQueryDto) {
    const managerView = currentUser.role === 'manager';
    await this.paymentsService.syncPendingPayosTransactions(currentUser.clinicId, managerView ? 20 : 8, {
      force: managerView,
    });
    if (managerView) {
      await this.paymentsService.reconcileAppointmentPaymentStatus(currentUser.clinicId, 500);
    }

    const where: Prisma.AppointmentWhereInput = {
      clinicId: currentUser.clinicId,
      ...(query.status ? { status: query.status } : {}),
    };

    if (currentUser.role === 'customer') {
      const customer = await this.prisma.customer.findFirst({
        where: {
          clinicId: currentUser.clinicId,
          userId: currentUser.userId,
        },
        select: { id: true },
      });
      if (!customer) {
        return [];
      }
      where.customerId = customer.id;
      where.customer = {
        clinicId: currentUser.clinicId,
        userId: currentUser.userId,
      };
    }

    const appointments = await this.prisma.appointment.findMany({
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

    return this.reconcilePaymentStatusFromInvoices(currentUser.clinicId, appointments);
  }

  async create(dto: CreateAppointmentDto, currentUser: AuthUser) {
    const slot = new Date(dto.appointmentAt);
    const customerId = await this.resolveCustomerId(currentUser, dto.customerId);
    const [pet, service] = await Promise.all([
      this.prisma.pet.findFirst({
        where: {
          id: dto.petId,
          clinicId: currentUser.clinicId,
        },
        select: { id: true, customerId: true, clinicId: true },
      }),
      this.prisma.service.findFirst({
        where: {
          id: dto.serviceId,
          clinicId: currentUser.clinicId,
        },
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

    const appointment = await this.prisma.$transaction(async (tx) => {
      const collision = await tx.appointment.findFirst({
        where: {
          clinicId: currentUser.clinicId,
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
          clinicId: currentUser.clinicId,
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
        clinicId: currentUser.clinicId,
        appointment,
      });

      await this.createAppointmentNotification(tx, {
        clinicId: currentUser.clinicId,
        customerId: appointment.customerId,
        title: 'Lịch hẹn mới',
        body: `${appointment.customer.name} vừa đặt lịch cho ${appointment.pet.name}.`,
        target: NotificationTarget.manager,
        linkTo: '/manager/bookings',
      });

      await this.createAppointmentNotification(tx, {
        clinicId: currentUser.clinicId,
        customerId: appointment.customerId,
        userId: currentUser.role === 'customer' ? currentUser.userId : undefined,
        title: 'Đặt lịch thành công',
        body: `Lịch hẹn ${appointment.service.name} cho ${appointment.pet.name} đã được ghi nhận.`,
        target: NotificationTarget.customer,
        linkTo: '/customer/appointments',
      });

      return appointment;
    });

    this.realtimeService.emitNotificationCreated({
      type: 'appointment.notification',
      clinicId: currentUser.clinicId,
      appointmentId: appointment.id,
    });

    return appointment;
  }

  async updateStatus(id: string, dto: UpdateAppointmentStatusDto, currentUser: AuthUser) {
    if (currentUser.role !== 'manager') {
      throw new ForbiddenException('Only manager can update appointment workflow status');
    }

    const current = await this.prisma.appointment.findFirst({
      where: {
        id,
        clinicId: currentUser.clinicId,
      },
    });
    if (!current) {
      throw new NotFoundException('Appointment not found');
    }

    if (!this.canTransition(current.status, dto.status)) {
      throw new BadRequestException(`Invalid status transition: ${current.status} -> ${dto.status}`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.appointment.update({
        where: { id },
        data: {
          status: dto.status,
          managerId: currentUser.userId,
        },
        include: {
          customer: true,
          pet: true,
          service: true,
        },
      });

      if (dto.status === AppointmentStatus.completed) {
        await this.upsertMedicalRecordFromCompletedAppointment(tx, result.id, currentUser.userId);
      }

      await this.createAppointmentNotification(tx, {
        clinicId: currentUser.clinicId,
        customerId: result.customerId,
        title: 'Cập nhật lịch hẹn',
        body: `Lịch hẹn ${result.service.name} của ${result.pet.name} đã chuyển sang "${this.statusLabel(dto.status)}".`,
        target: NotificationTarget.customer,
        linkTo: '/customer/appointments',
      });

      return result;
    });

    this.realtimeService.emitAppointmentUpdated({
      type: 'status',
      clinicId: currentUser.clinicId,
      appointmentId: id,
      status: dto.status,
    });
    this.realtimeService.emitNotificationCreated({
      type: 'appointment.notification',
      clinicId: currentUser.clinicId,
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
    const current = await this.prisma.appointment.findFirst({
      where: {
        id,
        clinicId: currentUser.clinicId,
      },
    });
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
      if (current.status !== AppointmentStatus.pending) {
        throw new BadRequestException('Customer can only cancel pending appointment');
      }

      const customer = await this.prisma.customer.findFirst({
        where: {
          clinicId: currentUser.clinicId,
          userId: currentUser.userId,
        },
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
      clinicId: currentUser.clinicId,
      appointmentId: id,
      status: AppointmentStatus.cancelled,
    });

    await this.createAppointmentNotification(this.prisma, {
      clinicId: currentUser.clinicId,
      customerId: appointment.customerId,
      title: 'Lịch hẹn đã hủy',
      body: `${appointment.service.name} cho ${appointment.pet.name} đã bị hủy.`,
      target: currentUser.role === 'manager' ? NotificationTarget.customer : NotificationTarget.manager,
      userId: currentUser.role === 'customer' ? currentUser.userId : undefined,
      linkTo: currentUser.role === 'manager' ? '/customer/appointments' : '/manager/bookings',
    });
    this.realtimeService.emitNotificationCreated({
      type: 'appointment.notification',
      clinicId: currentUser.clinicId,
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
      const customer = await this.prisma.customer.findFirst({
        where: {
          id: requestedCustomerId,
          clinicId: currentUser.clinicId,
        },
        select: { id: true },
      });
      if (!customer) {
        throw new NotFoundException('Customer not found in current clinic');
      }
      return requestedCustomerId;
    }

    const customer = await this.prisma.customer.findFirst({
      where: {
        userId: currentUser.userId,
        clinicId: currentUser.clinicId,
      },
      select: { id: true },
    });
    if (!customer) {
      throw new ForbiddenException('Customer profile not found for current account');
    }

    return customer.id;
  }

  private async upsertMedicalRecordFromCompletedAppointment(
    tx: Prisma.TransactionClient,
    appointmentId: string,
    managerId: string,
  ) {
    const appointment = await tx.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        service: true,
      },
    });

    if (!appointment || appointment.status !== AppointmentStatus.completed) {
      return;
    }

    const recordedAt = appointment.paidAt ?? new Date();
    const diagnosis = `Dịch vụ sử dụng: ${appointment.service.name}`;
    const treatment = appointment.note?.trim()
      ? `Theo ghi chú cuộc hẹn: ${appointment.note.trim()}`
      : `Hoàn tất dịch vụ ${appointment.service.name} theo lịch hẹn.`;

    await tx.medicalRecord.upsert({
      where: { appointmentId: appointment.id },
      create: {
        clinicId: appointment.clinicId,
        petId: appointment.petId,
        customerId: appointment.customerId,
        appointmentId: appointment.id,
        doctorName: 'Manager',
        diagnosis,
        treatment,
        notes: appointment.note ?? null,
        recordedAt,
        createdById: managerId,
      },
      update: {
        diagnosis,
        treatment,
        notes: appointment.note ?? null,
        recordedAt,
        createdById: managerId,
      },
    });

    await tx.pet.update({
      where: { id: appointment.petId },
      data: { lastCheckupAt: recordedAt },
    });
  }

  private async createAppointmentNotification(
    tx: Prisma.TransactionClient | PrismaService,
    input: {
      clinicId: string;
      customerId: string;
      target: NotificationTarget;
      title: string;
      body: string;
      linkTo?: string;
      userId?: string;
    },
  ) {
    const customer = await tx.customer.findUnique({
      where: { id: input.customerId },
      select: { userId: true },
    });

    await tx.notification.create({
      data: {
        clinicId: input.clinicId,
        customerId: input.customerId,
        userId: input.userId ?? customer?.userId ?? null,
        target: input.target,
        title: input.title,
        body: input.body,
        linkTo: input.linkTo ?? null,
      },
    });
  }

  private statusLabel(status: AppointmentStatus) {
    if (status === AppointmentStatus.pending) return 'Chờ xác nhận';
    if (status === AppointmentStatus.confirmed) return 'Đã xác nhận';
    if (status === AppointmentStatus.completed) return 'Hoàn thành';
    return 'Đã hủy';
  }

  private async reconcilePaymentStatusFromInvoices(
    clinicId: string,
    appointments: AppointmentListItem[],
  ): Promise<AppointmentListItem[]> {
    if (appointments.length === 0) {
      return appointments;
    }

    const appointmentIds = appointments.map((appointment) => appointment.id);
    const paidInvoices = await this.prisma.invoice.findMany({
      where: {
        clinicId,
        appointmentId: { in: appointmentIds },
        paymentStatus: PaymentStatus.paid,
      },
      select: {
        appointmentId: true,
        updatedAt: true,
      },
    });

    if (paidInvoices.length === 0) {
      return appointments;
    }

    const paidAtByAppointmentId = new Map<string, Date>();
    for (const invoice of paidInvoices) {
      if (!invoice.appointmentId) {
        continue;
      }
      const current = paidAtByAppointmentId.get(invoice.appointmentId);
      if (!current || invoice.updatedAt > current) {
        paidAtByAppointmentId.set(invoice.appointmentId, invoice.updatedAt);
      }
    }

    const needsPatchIds = appointments
      .filter(
        (appointment) =>
          paidAtByAppointmentId.has(appointment.id) &&
          (appointment.paymentStatus !== PaymentStatus.paid || !appointment.paidAt),
      )
      .map((appointment) => appointment.id);

    if (needsPatchIds.length > 0) {
      const patchPaidAt = new Date();
      await this.prisma.appointment.updateMany({
        where: {
          id: { in: needsPatchIds },
          paymentStatus: { not: PaymentStatus.paid },
        },
        data: {
          paymentStatus: PaymentStatus.paid,
          paidAt: patchPaidAt,
        },
      });
    }

    return appointments.map((appointment) => {
      const invoicePaidAt = paidAtByAppointmentId.get(appointment.id);
      if (!invoicePaidAt) {
        return appointment;
      }

      return {
        ...appointment,
        paymentStatus: PaymentStatus.paid,
        paidAt: appointment.paidAt ?? invoicePaidAt,
      };
    });
  }
}
