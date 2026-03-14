import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const requiredConfirmation = 'WIPE_PETHUB_PRODUCTION_DB';
if (process.env.WIPE_DB_CONFIRM !== requiredConfirmation) {
  throw new Error(
    `Refusing to wipe database. Set WIPE_DB_CONFIRM=${requiredConfirmation} to continue.`,
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main() {
  console.log('Starting destructive wipe...');

  const deleted = await prisma.$transaction(async (tx) => {
    const result = {
      auditLog: await tx.auditLog.deleteMany(),
      digitalCardEvent: await tx.digitalCardEvent.deleteMany(),
      medicalRecord: await tx.medicalRecord.deleteMany(),
      paymentTransaction: await tx.paymentTransaction.deleteMany(),
      reminder: await tx.reminder.deleteMany(),
      notification: await tx.notification.deleteMany(),
      invoiceLineItem: await tx.invoiceLineItem.deleteMany(),
      invoice: await tx.invoice.deleteMany(),
      appointment: await tx.appointment.deleteMany(),
      pet: await tx.pet.deleteMany(),
      customer: await tx.customer.deleteMany(),
      service: await tx.service.deleteMany(),
      product: await tx.product.deleteMany(),
      subscription: await tx.subscription.deleteMany(),
      reminderTemplate: await tx.reminderTemplate.deleteMany(),
      clinicSettings: await tx.clinicSettings.deleteMany(),
      user: await tx.user.deleteMany(),
      clinic: await tx.clinic.deleteMany(),
    };

    return result;
  });

  const remaining = {
    users: await prisma.user.count(),
    customers: await prisma.customer.count(),
    pets: await prisma.pet.count(),
    appointments: await prisma.appointment.count(),
    invoices: await prisma.invoice.count(),
    clinics: await prisma.clinic.count(),
  };

  console.log('Deleted rows:');
  console.table(
    Object.entries(deleted).map(([table, payload]) => ({
      table,
      count: payload.count,
    })),
  );

  console.log('Remaining rows after wipe:');
  console.table(remaining);
}

void main()
  .catch((error) => {
    console.error('Database wipe failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
