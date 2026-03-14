import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

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
  const mode = (process.env.SEED_MODE ?? 'empty').trim().toLowerCase();

  if (mode === 'empty') {
    console.log(
      'Seed skipped: production-safe empty mode. No sample records are inserted. Set SEED_MODE=demo only for local demo data.',
    );
    return;
  }

  if (mode !== 'demo') {
    throw new Error(`Unsupported SEED_MODE "${mode}". Allowed values: empty | demo`);
  }

  await resetDatabase();
  console.log('SEED_MODE=demo currently performs reset only. Add explicit local demo data if needed.');
}

main()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
