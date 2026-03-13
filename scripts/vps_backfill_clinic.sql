-- One-time production backfill script for introducing clinic-aware schema
-- Safe for re-run (idempotent where possible).

BEGIN;

CREATE TABLE IF NOT EXISTS "Clinic" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "address" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Clinic_slug_key" ON "Clinic"("slug");

INSERT INTO "Clinic" ("id", "slug", "name", "isActive")
VALUES ('clinic_default', 'default', 'Default PetHub Clinic', true)
ON CONFLICT ("slug")
DO UPDATE SET "name" = EXCLUDED."name", "isActive" = true;

-- Required clinicId columns for legacy tables
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;
UPDATE "User" SET "clinicId" = 'clinic_default' WHERE "clinicId" IS NULL;
ALTER TABLE "User" ALTER COLUMN "clinicId" SET DEFAULT 'clinic_default';
ALTER TABLE "User" ALTER COLUMN "clinicId" SET NOT NULL;

ALTER TABLE "ClinicSettings" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;
UPDATE "ClinicSettings" SET "clinicId" = 'clinic_default' WHERE "clinicId" IS NULL;
ALTER TABLE "ClinicSettings" ALTER COLUMN "clinicId" SET DEFAULT 'clinic_default';
ALTER TABLE "ClinicSettings" ALTER COLUMN "clinicId" SET NOT NULL;

ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;
UPDATE "Customer" SET "clinicId" = 'clinic_default' WHERE "clinicId" IS NULL;
ALTER TABLE "Customer" ALTER COLUMN "clinicId" SET DEFAULT 'clinic_default';
ALTER TABLE "Customer" ALTER COLUMN "clinicId" SET NOT NULL;

ALTER TABLE "Pet" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;
UPDATE "Pet" SET "clinicId" = 'clinic_default' WHERE "clinicId" IS NULL;
ALTER TABLE "Pet" ALTER COLUMN "clinicId" SET DEFAULT 'clinic_default';
ALTER TABLE "Pet" ALTER COLUMN "clinicId" SET NOT NULL;

ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;
UPDATE "Service" SET "clinicId" = 'clinic_default' WHERE "clinicId" IS NULL;
ALTER TABLE "Service" ALTER COLUMN "clinicId" SET DEFAULT 'clinic_default';
ALTER TABLE "Service" ALTER COLUMN "clinicId" SET NOT NULL;

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;
UPDATE "Product" SET "clinicId" = 'clinic_default' WHERE "clinicId" IS NULL;
ALTER TABLE "Product" ALTER COLUMN "clinicId" SET DEFAULT 'clinic_default';
ALTER TABLE "Product" ALTER COLUMN "clinicId" SET NOT NULL;

ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;
UPDATE "Appointment" SET "clinicId" = 'clinic_default' WHERE "clinicId" IS NULL;
ALTER TABLE "Appointment" ALTER COLUMN "clinicId" SET DEFAULT 'clinic_default';
ALTER TABLE "Appointment" ALTER COLUMN "clinicId" SET NOT NULL;

ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;
UPDATE "Invoice" SET "clinicId" = 'clinic_default' WHERE "clinicId" IS NULL;
ALTER TABLE "Invoice" ALTER COLUMN "clinicId" SET DEFAULT 'clinic_default';
ALTER TABLE "Invoice" ALTER COLUMN "clinicId" SET NOT NULL;

ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;
UPDATE "Notification" SET "clinicId" = 'clinic_default' WHERE "clinicId" IS NULL;
ALTER TABLE "Notification" ALTER COLUMN "clinicId" SET DEFAULT 'clinic_default';
ALTER TABLE "Notification" ALTER COLUMN "clinicId" SET NOT NULL;

ALTER TABLE "Reminder" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;
UPDATE "Reminder" SET "clinicId" = 'clinic_default' WHERE "clinicId" IS NULL;
ALTER TABLE "Reminder" ALTER COLUMN "clinicId" SET DEFAULT 'clinic_default';
ALTER TABLE "Reminder" ALTER COLUMN "clinicId" SET NOT NULL;

ALTER TABLE "ReminderTemplate" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;
UPDATE "ReminderTemplate" SET "clinicId" = 'clinic_default' WHERE "clinicId" IS NULL;
ALTER TABLE "ReminderTemplate" ALTER COLUMN "clinicId" SET DEFAULT 'clinic_default';
ALTER TABLE "ReminderTemplate" ALTER COLUMN "clinicId" SET NOT NULL;

ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;
UPDATE "Subscription" SET "clinicId" = 'clinic_default' WHERE "clinicId" IS NULL;
ALTER TABLE "Subscription" ALTER COLUMN "clinicId" SET DEFAULT 'clinic_default';
ALTER TABLE "Subscription" ALTER COLUMN "clinicId" SET NOT NULL;

ALTER TABLE "PaymentTransaction" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;
UPDATE "PaymentTransaction" SET "clinicId" = 'clinic_default' WHERE "clinicId" IS NULL;
ALTER TABLE "PaymentTransaction" ALTER COLUMN "clinicId" SET DEFAULT 'clinic_default';
ALTER TABLE "PaymentTransaction" ALTER COLUMN "clinicId" SET NOT NULL;

ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;
UPDATE "AuditLog" SET "clinicId" = 'clinic_default' WHERE "clinicId" IS NULL;

COMMIT;
