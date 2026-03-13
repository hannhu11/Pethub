SELECT 'User' AS table_name, "clinicId", email, COUNT(*)
FROM "User"
GROUP BY "clinicId", email
HAVING COUNT(*) > 1;

SELECT 'Service' AS table_name, "clinicId", code, COUNT(*)
FROM "Service"
GROUP BY "clinicId", code
HAVING COUNT(*) > 1;

SELECT 'Product' AS table_name, "clinicId", sku, COUNT(*)
FROM "Product"
GROUP BY "clinicId", sku
HAVING COUNT(*) > 1;

SELECT 'Appointment' AS table_name, "clinicId", "petId", "appointmentAt", COUNT(*)
FROM "Appointment"
GROUP BY "clinicId", "petId", "appointmentAt"
HAVING COUNT(*) > 1;

SELECT 'ReminderTemplate' AS table_name, "clinicId", name, COUNT(*)
FROM "ReminderTemplate"
GROUP BY "clinicId", name
HAVING COUNT(*) > 1;

SELECT 'ClinicSettings' AS table_name, "clinicId", COUNT(*)
FROM "ClinicSettings"
GROUP BY "clinicId"
HAVING COUNT(*) > 1;
