import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  AppointmentStatus,
  CustomerSegment,
  PaymentStatus,
  Role,
  PaymentMethod,
  InvoiceItemType,
} from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run prisma seed');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function resetDatabase() {
  await prisma.auditLog.deleteMany();
  await prisma.digitalCardEvent.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.invoiceLineItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.pet.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.service.deleteMany();
  await prisma.product.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.reminderTemplate.deleteMany();
  await prisma.clinicSettings.deleteMany();
  await prisma.user.deleteMany();
  await prisma.clinic.deleteMany();
}

async function main() {
  await resetDatabase();

  const clinic = await prisma.clinic.create({
    data: {
      slug: 'pet-hub-clinic',
      name: 'PetHub Clinic',
      phone: '028-1234-5678',
      address: '123 Nguyễn Huệ, Q.1, TP.HCM',
    },
  });

  const manager = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      firebaseUid: 'mock-admin-uid',
      role: Role.manager,
      name: 'Phạm Hương',
      phone: '0934567890',
      email: 'admin@manager.pethub.vn',
    },
  });

  const customerUserA = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      firebaseUid: 'mock-customer-nguyenvanan-uid',
      role: Role.customer,
      name: 'Nguyễn Văn An',
      phone: '0901234567',
      email: 'an.nguyen@email.com',
    },
  });

  const customerUserB = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      firebaseUid: 'mock-customer-tranthibinh-uid',
      role: Role.customer,
      name: 'Trần Thị Bình',
      phone: '0912345678',
      email: 'binh.tran@email.com',
    },
  });

  await prisma.clinicSettings.create({
    data: {
      clinicId: clinic.id,
      clinicName: clinic.name,
      taxId: '0123456789',
      phone: clinic.phone ?? '028-1234-5678',
      address: clinic.address ?? 'TP.HCM',
      invoiceNote: 'Cảm ơn quý khách đã sử dụng dịch vụ tại PetHub!',
      updatedById: manager.id,
    },
  });

  const customerA = await prisma.customer.create({
    data: {
      clinicId: clinic.id,
      userId: customerUserA.id,
      name: customerUserA.name,
      phone: customerUserA.phone,
      email: customerUserA.email,
      segment: CustomerSegment.regular,
      totalSpent: 750_000,
      totalVisits: 5,
      lastVisitAt: new Date('2026-03-10T09:00:00+07:00'),
    },
  });

  const customerB = await prisma.customer.create({
    data: {
      clinicId: clinic.id,
      userId: customerUserB.id,
      name: customerUserB.name,
      phone: customerUserB.phone,
      email: customerUserB.email,
      segment: CustomerSegment.regular,
      totalSpent: 150_000,
      totalVisits: 2,
      lastVisitAt: new Date('2026-03-08T10:00:00+07:00'),
    },
  });

  const [serviceCheckup, serviceSpa, serviceTrim, serviceVaccine] = await Promise.all([
    prisma.service.create({
      data: {
        clinicId: clinic.id,
        code: 'SRV-CHECKUP',
        name: 'Khám tổng quát',
        description: 'Kiểm tra tổng quát, đo nhiệt độ, nghe tim phổi và tư vấn',
        durationMin: 30,
        price: 200_000,
      },
    }),
    prisma.service.create({
      data: {
        clinicId: clinic.id,
        code: 'SRV-SPA',
        name: 'Tắm & Spa',
        description: 'Tắm, sấy và vệ sinh chuyên sâu',
        durationMin: 60,
        price: 150_000,
      },
    }),
    prisma.service.create({
      data: {
        clinicId: clinic.id,
        code: 'SRV-TRIM',
        name: 'Cắt tỉa lông',
        description: 'Cắt tỉa theo giống và yêu cầu',
        durationMin: 90,
        price: 250_000,
      },
    }),
    prisma.service.create({
      data: {
        clinicId: clinic.id,
        code: 'SRV-VACCINE',
        name: 'Tiêm phòng',
        description: 'Tiêm phòng bệnh truyền nhiễm theo lịch',
        durationMin: 15,
        price: 300_000,
      },
    }),
  ]);

  const productFood = await prisma.product.create({
    data: {
      clinicId: clinic.id,
      sku: 'PRD-FOOD-DOG-2KG',
      name: 'Hạt cho chó 2kg',
      category: 'Thức ăn',
      description: 'Hạt dinh dưỡng tổng hợp cho chó trưởng thành',
      price: 320_000,
      stock: 120,
    },
  });

  await prisma.product.create({
    data: {
      clinicId: clinic.id,
      sku: 'PRD-COLLAR-BASIC',
      name: 'Vòng cổ cơ bản',
      category: 'Phụ kiện',
      description: 'Vòng cổ dây mềm cho chó mèo',
      price: 120_000,
      stock: 80,
    },
  });

  const petLucky = await prisma.pet.create({
    data: {
      clinicId: clinic.id,
      customerId: customerA.id,
      name: 'Lucky',
      species: 'Chó',
      breed: 'Golden Retriever',
      gender: 'Đực',
      dateOfBirth: new Date('2022-03-15'),
      weightKg: 28,
      coatColor: 'Vàng kem',
      bloodType: 'DEA 1.1+',
      neutered: 'yes',
      microchipId: 'MC-GLD-001-8891',
      specialNotes: 'Dị ứng nhẹ với thức ăn nhiều đạm',
      lastCheckupAt: new Date('2026-03-08T09:00:00+07:00'),
      imageUrl: '/assets/lucky.jpg',
    },
  });

  const petMimi = await prisma.pet.create({
    data: {
      clinicId: clinic.id,
      customerId: customerA.id,
      name: 'Mimi',
      species: 'Mèo',
      breed: 'Anh lông ngắn',
      gender: 'Cái',
      dateOfBirth: new Date('2023-07-20'),
      weightKg: 4.5,
      coatColor: 'Đen',
      bloodType: 'AB',
      neutered: 'no',
      microchipId: 'MC-CAT-777-9901',
      specialNotes: 'Không dùng thực phẩm có lactose',
      lastCheckupAt: new Date('2026-02-20T09:30:00+07:00'),
      imageUrl: '/assets/mimi.jpg',
    },
  });

  const petBong = await prisma.pet.create({
    data: {
      clinicId: clinic.id,
      customerId: customerB.id,
      name: 'Bông',
      species: 'Chó',
      breed: 'Corgi',
      gender: 'Cái',
      dateOfBirth: new Date('2024-01-10'),
      weightKg: 12,
      coatColor: 'Nâu trắng',
      bloodType: 'DEA 1.1-',
      neutered: 'no',
      microchipId: 'MC-CRG-003-2209',
      specialNotes: 'Cần kiểm soát cân nặng',
      lastCheckupAt: new Date('2026-02-28T14:00:00+07:00'),
      imageUrl: '/assets/bong.jpg',
    },
  });

  const completedAppointment = await prisma.appointment.create({
    data: {
      clinicId: clinic.id,
      customerId: customerA.id,
      petId: petLucky.id,
      serviceId: serviceVaccine.id,
      appointmentAt: new Date('2026-03-08T09:00:00+07:00'),
      note: 'Tiêm vaccine nhắc lại',
      status: AppointmentStatus.completed,
      paymentStatus: PaymentStatus.paid,
      managerId: manager.id,
      paidAt: new Date('2026-03-08T09:45:00+07:00'),
    },
  });

  await Promise.all([
    prisma.appointment.create({
      data: {
        clinicId: clinic.id,
        customerId: customerA.id,
        petId: petLucky.id,
        serviceId: serviceCheckup.id,
        appointmentAt: new Date('2026-03-26T11:30:00+07:00'),
        note: 'Kiểm tra sức khỏe định kỳ',
        status: AppointmentStatus.confirmed,
        paymentStatus: PaymentStatus.unpaid,
      },
    }),
    prisma.appointment.create({
      data: {
        clinicId: clinic.id,
        customerId: customerA.id,
        petId: petMimi.id,
        serviceId: serviceSpa.id,
        appointmentAt: new Date('2026-03-12T10:00:00+07:00'),
        note: 'Spa định kỳ',
        status: AppointmentStatus.pending,
        paymentStatus: PaymentStatus.unpaid,
      },
    }),
    prisma.appointment.create({
      data: {
        clinicId: clinic.id,
        customerId: customerB.id,
        petId: petBong.id,
        serviceId: serviceTrim.id,
        appointmentAt: new Date('2026-03-13T14:00:00+07:00'),
        note: 'Cắt tỉa lông vệ sinh',
        status: AppointmentStatus.confirmed,
        paymentStatus: PaymentStatus.unpaid,
      },
    }),
  ]);

  const invoice = await prisma.invoice.create({
    data: {
      clinicId: clinic.id,
      invoiceNo: 'INV-20260308-094500',
      appointmentId: completedAppointment.id,
      customerId: customerA.id,
      managerId: manager.id,
      paymentMethod: PaymentMethod.cash,
      paymentStatus: PaymentStatus.paid,
      subtotal: 300_000,
      taxPercent: 8,
      taxAmount: 24_000,
      grandTotal: 324_000,
      immutableHash: 'seed-invoice-hash',
      items: {
        create: [
          {
            itemType: InvoiceItemType.service,
            serviceId: serviceVaccine.id,
            petId: petLucky.id,
            name: serviceVaccine.name,
            qty: 1,
            unitPrice: 300_000,
            total: 300_000,
          },
          {
            itemType: InvoiceItemType.product,
            productId: productFood.id,
            petId: petLucky.id,
            name: productFood.name,
            qty: 1,
            unitPrice: 0,
            total: 0,
          },
        ],
      },
    },
  });

  await prisma.paymentTransaction.create({
    data: {
      clinicId: clinic.id,
      invoiceId: invoice.id,
      provider: 'pos',
      providerRef: 'SEED-PAID-INV-20260308-094500',
      paymentMethod: PaymentMethod.cash,
      amount: 324_000,
      status: PaymentStatus.paid,
      currency: 'VND',
      paidAt: new Date('2026-03-08T09:45:00+07:00'),
    },
  });

  await prisma.medicalRecord.create({
    data: {
      clinicId: clinic.id,
      petId: petLucky.id,
      customerId: customerA.id,
      appointmentId: completedAppointment.id,
      doctorName: manager.name,
      diagnosis: 'Tiêm phòng định kỳ',
      treatment: 'Tiêm vaccine nhắc lại và theo dõi phản ứng 24h',
      notes: 'Sức khỏe ổn định',
      recordedAt: new Date('2026-03-08T09:40:00+07:00'),
      createdById: manager.id,
    },
  });

  await prisma.reminderTemplate.createMany({
    data: [
      {
        clinicId: clinic.id,
        name: 'Nhắc tiêm phòng',
        type: 'vaccine',
        channelDefaults: ['email', 'sms'],
        messageTemplate:
          'Kính gửi [CustomerName], [PetName] đã đến lịch tiêm phòng tại [ClinicName]. Vui lòng đặt hẹn sớm.',
      },
      {
        clinicId: clinic.id,
        name: 'Nhắc tái khám',
        type: 'checkup',
        channelDefaults: ['email'],
        messageTemplate:
          'Kính gửi [CustomerName], [PetName] cần tái khám theo lịch tại [ClinicName].',
      },
    ],
  });

  console.log('Seed completed with clinic-scoped data and baseline records.');
}

main()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
