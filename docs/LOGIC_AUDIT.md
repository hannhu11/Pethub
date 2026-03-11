# PetHub Logic Audit (Customer vs Manager)

Last updated: 2026-03-12

## 1) Role Matrix

| Module | Customer | Manager |
|---|---|---|
| Profile | Read/Update own profile | Read/Update own profile |
| Customer records | Read own info only | Full read, segmentation, detail |
| Pet records | Read own pets | Full CRUD for clinic pets |
| Appointments | Create/cancel own appointments | Confirm/cancel/complete all appointments |
| POS checkout | No access | Single source of payment |
| Invoice | Read own invoices only (future endpoint) | Create/read/export all invoices |
| Notifications | Read own notifications | Read/mark-all/read-one all manager notifications |
| Reminders | No direct management | Full reminder workflow + templates |
| Settings | No clinic settings | Profile/clinic/password/subscription |
| Premium payment | No access | payOS/VietQR checkout + webhook activation |

## 2) State Machines

### Appointment

`pending -> confirmed -> completed`

`pending -> cancelled`

`confirmed -> cancelled`

`completed` and `cancelled` are terminal.

### Payment

Payment is processed only in POS:

`unpaid -> paid -> refunded(optional)`

### Invoice

Invoice is created only by checkout and becomes immutable data snapshot:

- Customer identity snapshot
- Pet snapshot
- Itemized lines
- Subtotal/VAT/Total
- Payment method and paid timestamp

### Notification

`unread -> read`

Click behavior:

1. mark `read`
2. decrease unread badge
3. navigate to target route

### Reminder

`scheduled`, `sent`, `failed`, `cancelled`

Success rate formula:

`sent / (sent + failed) * 100`

`scheduled` and `cancelled` are excluded from denominator.

## 3) Consistency Rules

1. POS is the only payment entrypoint.
2. Appointment page never executes payment settlement.
3. Customer and manager pet details use the same backend payload shape.
4. Notification unread count is derived from backend state, not local UI counters.
5. Clinic settings become source of truth for invoice header/footer.

## 4) Concurrency Rule

Appointment creation uses DB transaction and slot conflict check:

- If slot occupied (`pending` or `confirmed`) -> `409 Conflict`
- Otherwise create appointment in transaction

## 5) Rollout Checklist

1. Replace frontend local stores module by module with API integration.
2. Enable websocket event subscribers for notifications/appointments/reminders.
3. Migrate existing mock data to PostgreSQL seed scripts.
4. Turn off `AUTH_MOCK_ENABLED` on production.
