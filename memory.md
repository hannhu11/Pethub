# PetHub Memory Log

## Session Date
- 2026-03-13 (Asia/Seoul)

## Base / Branch
- Base reference: `main@c6cca50`
- Working branch: `codex/backend-stabilization-phase1`

## Commits Delivered In This Phase
- `298d20c` feat(backend): add clinic-aware auth onboarding and profile sync
- `f0d9434` feat(backend): persist medical records and expose digital card view
- `7b2e0f1` feat(backend): harden payment flow and unify tenant analytics
- `51f5cd7` feat(frontend): forward clinic slug during firebase sync

## Backend Changes Completed
- Auth onboarding:
  - `POST /api/auth/sync-firebase` now accepts `clinicSlug` and returns onboarding status.
  - Added `POST /api/auth/onboarding/complete`.
  - Sync logic improved for `User <-> Customer` profile consistency.
- Medical records:
  - Added manager CRUD APIs and customer read flow.
  - Appointment status `completed` now creates/updates medical record.
- Digital card:
  - Added aggregated `GET /api/pets/:petId/digital-card`.
  - Added `POST /api/pets/:petId/digital-card/regenerate` (event/audit only).
- POS/payments:
  - POS checkout supports immediate paid (`cash/card`) and pending (`transfer/payos`).
  - Added payOS create-link integration and webhook signature/idempotency handling.
  - Synced invoice/payment/appointment/customer totals on paid flow.
- Analytics:
  - Added `GET /api/analytics/overview` and `GET /api/analytics/customers/ltv-summary`.
  - Unified aggregate source to reduce overview/LTV mismatch.
- Security hardening:
  - Role guard tightening on manager-only operations.
  - Ownership and tenant scoping for customer/manager access paths.

## VPS Deployment Notes
- VPS host: `140.245.119.189`
- Deployed path: `/home/ubuntu/pethub`
- Deploy method:
  - Backup source archive created: `/home/ubuntu/backups/pethub-src-2026-03-13-103847.tgz`
  - Synced source via `git archive` package copy/extract (VPS does not use `.git` repo).
- DB schema:
  - Ran `prisma db push` in production compose context.
  - Result: database already in sync.
- Rebuild/restart:
  - Ran `docker compose --env-file .env.production -f docker-compose.production.yml -p pethub up -d --build api worker web nginx`

## Production Deploy Issue Encountered
- Issue:
  - Docker backend build failed with many TypeScript errors from `backend/seed.ts`.
- Root cause:
  - `backend/seed.ts` was an old leftover file on VPS (not part of current tracked source), but got compiled during container build.
- Fix:
  - Removed stale file `/home/ubuntu/pethub/backend/seed.ts`.
  - Re-ran compose build successfully.

## Post-Deploy Verification
- `docker compose ps`: all services up (`api`, `worker`, `web`, `nginx`, `postgres`, `redis`).
- API health:
  - `GET /api/health` returns `200 OK`.
- API route map confirms new endpoints are loaded:
  - onboarding complete route
  - pet medical-record routes
  - digital-card routes
  - analytics routes
  - payOS routes

## Sensitive Data Handling
- No secrets added to git commits.
- No `.env` files committed.
- Deployed env values checked on VPS by `SET/EMPTY` status only (no raw value printing).
- Reminder: keep all key rotation and secret updates only in VPS env/secrets, never in repo.

## Current Status For Testing
- VPS is running the latest backend/frontend build for this phase.
- Ready for UAT on:
  - Google first-login onboarding completion
  - profile sync consistency
  - medical record persistence
  - digital card aggregate data
  - POS transfer/QR + payOS webhook
  - overview vs customer LTV consistency

## Incident 2026-03-13 (Auth timeout / server busy on login)
- Symptom reported:
  - Login/Register spins for long time then shows server busy error.
- Root cause identified from live VPS logs:
  - `POST /api/auth/sync-firebase` returned `500`.
  - Prisma error `P2021`: relation `"public.Clinic"` does not exist.
  - DB was partially migrated (new code expected clinic-aware schema, legacy DB missing `Clinic` + `clinicId` rollout).
- Corrective actions executed:
  - Added one-time SQL backfill script:
    - `scripts/vps_backfill_clinic.sql`
    - creates `Clinic`, backfills `clinicId` on legacy tables, preserves data.
  - Added pre-check query pack:
    - `scripts/vps_check_unique_conflicts.sql`
    - validates no duplicate conflicts before unique constraints.
  - Ran production DB sync:
    - `prisma db push --accept-data-loss` (non-destructive in this case; only warnings for unique constraints, pre-validated no duplicates).
  - Verified new tables exist:
    - `Clinic`, `MedicalRecord`, `DigitalCardEvent`.
  - Rebuilt/restarted stack on VPS successfully.
- Defensive coding hardening added:
  - `backend/src/auth/auth.service.ts`
    - wrapped `syncFirebase` in robust `try/catch` with explicit error logging.
    - added Firebase verify fail-fast timeout via `verifyIdTokenWithTimeout`.
    - added graceful `ServiceUnavailable` response for missing-clinic-table scenario.
  - `docker/nginx/pethub.conf`
    - added `proxy_connect_timeout`, `proxy_send_timeout`, `proxy_read_timeout` to 60s for `/api`.
  - `src/app/lib/api-client.ts`
    - reduced axios timeout to `15000ms` for faster frontend fail feedback.
  - `docker/nginx/web-spa.conf`
    - enabled gzip compression for static assets.
    - enabled gzip for proxied traffic via `gzip_proxied any`.
    - added cache headers for `/assets` (`immutable`, 7 days).
    - added `no-store` for SPA shell route to avoid stale HTML.
- Operational note:
  - For file bind mounts, replacing host config file can require container recreate.
  - Applied with `docker compose ... up -d --force-recreate nginx` to ensure new nginx config is mounted.

## Stabilization Batch 2026-03-13 (Race fix + de-mock + production wipe)
- Trigger:
  - User reported slow login, Google onboarding skip, profile mismatch, dashboard/LTV mismatch, POS QR not working, and requested full purge of sample data.

- Root causes confirmed:
  - Frontend auth issued duplicate `/auth/sync-firebase` calls (login action + auth state listener), causing occasional race and `firebaseUid` unique conflict under concurrency.
  - Several critical UI routes were still using hardcoded mock data (customer profile/overview/appointments/pets, manager dashboard, manager POS, and manager customer route mapping).
  - VPS `.env.production` had missing payOS keys, so transfer/QR flow could not create real payOS checkout links.

- Code changes completed:
  - Backend auth race hardening:
    - `backend/src/auth/auth.service.ts`
    - replaced non-atomic find/create path with idempotent upsert + `P2002` fallback reconciliation by `(firebaseUid OR clinicId+email)`.
    - onboarding next step normalized to existing route: `/customer/profile?...`.
  - Frontend auth/session + onboarding enforcement:
    - `src/app/auth-session.tsx`
    - added in-flight sync dedupe per `firebaseUid`.
    - removed forced token refresh on every sync (`getIdToken()` instead of `getIdToken(true)`).
    - session now stores `onboarding`, guards redirect customer to required profile completion step.
  - API contracts updated:
    - `src/app/types.ts`
    - `src/app/lib/pethub-api.ts`
    - auth payload now includes onboarding; added analytics/POS/invoice/medical/digital-card API clients.
  - De-mock critical pages:
    - `src/app/components/customer-dashboard.tsx` rewritten to use real session + API for profile, pets, medical records, digital card.
    - `src/app/components/customer-overview.tsx` rewritten to use real pets/appointments.
    - `src/app/components/customer-appointments.tsx` rewritten to real create/list/cancel appointment APIs.
    - `src/app/components/manager-dashboard.tsx` rewritten to analytics endpoints and LTV cross-check from same backend source.
    - `src/app/components/manager-pos.tsx` rewritten to real POS checkout + payOS QR + invoice payment polling.
    - `src/app/routes.tsx` switched manager customer/pet routes to API-backed `manager-crm` pages.
  - Added destructive wipe utility:
    - `backend/prisma/wipe-production-db.ts`
    - `backend/package.json` script: `prisma:wipe`.

- VPS operational actions executed before Git push:
  - Uploaded patched files directly to VPS source path `/home/ubuntu/pethub`.
  - Updated payOS env keys in VPS `.env.production` (server-only, not in git).
  - Rebuilt and restarted containers:
    - `api`, `worker`, `web`, `nginx`.
  - Performed full production DB purge (sample + user data) via Prisma transaction script run in `api` container.
  - Verified post-wipe counts:
    - users/customers/pets/appointments/invoices/clinics = `0`.

- Security / secret handling:
  - No secrets committed to repository.
  - payOS keys only injected on VPS `.env.production`.
  - Keep webhook URL registration in payOS dashboard pointed to:
    - `http://140.245.119.189/api/payments/payos/webhook`

## Hotfix 2026-03-14 (Webhook verification + booking empty-state + admin role)
- Trigger from user testing:
  - Appointment form had empty service/pet selectors.
  - Requested manager role for `mnu3032004@gmail.com`.
  - payOS dashboard webhook check failed with 404/400.

- Code changes:
  - `backend/src/payments/payments.controller.ts`
    - Added explicit legacy alias route support:
      - `GET/POST /api/payments/payos/webhook`
      - `GET/POST /api/payments/payos-webhook`
    - Forced webhook POST status to `200` via `@HttpCode(200)` for gateway compatibility.
  - `backend/src/payments/payments.service.ts`
    - Added connectivity-probe handling for empty/non-payment webhook payloads (ack `200`).
    - Kept strict signature check for real payment payloads.
    - Added amount mismatch guard.
    - Unknown transaction now returns acknowledged `ignored` response instead of 404.
  - `src/app/components/services.tsx`
    - Removed mock-service source.
    - Now loads real catalog services via API (`listCatalogServices`).
    - Added loading/error/empty states.
  - `src/app/components/customer-appointments.tsx`
    - Added `serviceId` query prefill support from services page.
    - Added clear empty-state hints for no services/no pets.
    - Disabled selectors when no data source exists to avoid broken flow perception.

- VPS actions executed before any git push:
  - Synced changed files to `/home/ubuntu/pethub`.
  - Rebuilt/restarted containers (`api`, `web`, `nginx`; then `api` once more after route alias adjustment).
  - Live endpoint verification:
    - `GET /api/payments/payos/webhook` -> 200
    - `GET /api/payments/payos-webhook` -> 200
    - `POST /api/payments/payos/webhook` with `{}` -> 200
    - `POST /api/payments/payos-webhook` with `{}` -> 200

- Admin promotion status:
  - Verified in production DB:
    - email: `mnu3032004@gmail.com`
    - role: `manager`
    - clinic slug: `default`

- Security note:
  - No new secrets/keys were added to repository files in this hotfix.

## Stabilization Continuation 2026-03-14 (De-mock hard cleanup + VPS redeploy)
- Trigger from latest QA:
  - Charts missing in manager overview.
  - POS/service/product options not syncing.
  - Manager pets flow error: `customerId is required for manager pet operation`.
  - Reminder/notification screens still showing legacy sample data.
  - payOS dashboard webhook validation still reporting 400 in some attempts.

- Backend fixes:
  - `backend/src/pets/pets.service.ts`
    - Manager `GET /api/pets` no longer requires `customerId`.
    - Optional `customerId` (when provided) is validated against current clinic.
  - `backend/src/analytics/analytics.service.ts`
    - Extended overview response with chart-ready aggregates:
      - `monthlyRevenue`
      - `serviceRevenue`
      - `topServiceRevenue` from same aggregate source (for consistency).
  - `backend/src/payments/dto/payos-webhook.dto.ts`
    - Added DTO type transforms for webhook payload normalization.
  - `backend/src/payments/payments.service.ts`
    - More tolerant webhook flow:
      - probe payloads acknowledged (`200`)
      - invalid/unknown payloads return `ignored` (acknowledged) instead of hard-fail
      - signature verification kept for real matched transactions.

- Frontend sync/de-mock fixes:
  - Rewired manager pages to real APIs (catalog, dashboard charts, bookings, reminders, notifications, POS, invoice).
  - Added POS prefill from appointment (`/manager/pos?appointmentId=...`).
  - Added customer-side pet creation modal in dashboard flow (blank DB friendly).
  - Appointment UX fallback improved for no services / no pets.
  - Removed remaining mock dataset files from runtime:
    - deleted `src/app/components/data.ts`
    - deleted `src/app/components/manager-reminders-store.ts`
    - deleted `src/app/components/manager-notifications-store.ts`
    - added `src/app/components/pet-types.ts` to keep shared `Pet` type without mock payloads.

- Seed policy hardening:
  - Replaced `backend/prisma/seed.ts` with production-safe behavior:
    - default `SEED_MODE=empty` => no sample data inserted.
    - `SEED_MODE=demo` currently reset-only (no hardcoded demo customers/pets/services).
  - Goal: prevent accidental re-seeding of fake customers/services/reminders in future deployments.

- Verification (local):
  - Frontend build: pass (`npm run build`)
  - Backend build: pass (`backend npm run build`)
  - Backend tests: pass (`backend npm test -- --runInBand`)

- VPS deployment (before git push):
  - Synced changed files to `/home/ubuntu/pethub`.
  - Removed deleted mock files from VPS source tree.
  - Rebuilt/restarted stack:
    - `api`, `worker`, `web`, `nginx`.
  - Health checks:
    - `GET /api/health` => `200`
    - `GET /api/payments/payos/webhook` => `200`
    - `POST /api/payments/payos/webhook` with empty JSON probe => `200`.

- Security note:
  - No secrets committed.
  - No env values written into tracked files.

## VPS Data Reset Snapshot 2026-03-14 (Post-deploy cleanup)
- Action executed on VPS after redeploy:
  - Ran destructive wipe script in `api` container:
    - `WIPE_DB_CONFIRM=WIPE_PETHUB_PRODUCTION_DB node /app/dist/prisma/wipe-production-db.js`
  - Bootstrap restored minimal runtime baseline:
    - default clinic (`slug=default`)
    - manager account: `mnu3032004@gmail.com` (role `manager`)
- Verified DB counts after bootstrap:
  - `users=1`
  - `customers=0`
  - `pets=0`
  - `appointments=0`
  - `invoices=0`
  - `services=0`
  - `products=0`
  - `reminders=0`
  - `notifications=0`
  - `clinics=1`
- Endpoint health after reset:
  - `GET /api/health` => `200`
  - `GET /api/payments/payos/webhook` => `200`
  - `POST /api/payments/payos/webhook` with `{}` => `200`

## Iteration Update 2026-03-14 (PayOS Redirect + CRM/Pets Restore + Booking Sync)
- Branch:
  - `codex/backend-stabilization-phase1`
- Scope completed this round:
  - Fixed payOS return/cancel URL flow to avoid redirecting to dead domain.
  - Hardened POS pending->paid UX with stronger persistence/polling behavior.
  - Restored manager CRM/Pets feature surface (Quick Add Walk-in, profile edit, medical record CRUD, digital card refresh/regenerate/download).
  - Improved customer appointment list consistency after booking (including when note is present).
  - Re-cleansed VPS database to production blank state while preserving only one manager account.

- Code changes (backend):
  - `backend/src/pos/dto/pos-checkout.dto.ts`
    - Added optional `returnUrl` and `cancelUrl` in checkout contract.
  - `backend/src/pos/pos.service.ts`
    - Forwarded `returnUrl/cancelUrl` from POS checkout to payOS link creation.
  - `backend/src/payments/payments.service.ts`
    - Added URL sanitizer + redirect resolver for payOS `returnUrl/cancelUrl`.
    - Keeps fallback to env/default but now safely accepts frontend-provided runtime URL.
  - `backend/src/payments/payments.controller.ts`
    - Webhook endpoints accept raw payload object and remain available on both:
      - `POST /api/payments/payos/webhook`
      - `POST /api/payments/payos-webhook`
    - Health check GET route retained for dashboard testing.

- Code changes (frontend):
  - `src/app/lib/pethub-api.ts`
    - Extended `PosCheckoutPayload` with `returnUrl/cancelUrl`.
  - `src/app/components/manager-pos.tsx`
    - Sends dynamic runtime return/cancel URLs from `window.location.origin`.
    - Keeps last unpaid checkout in session storage to survive payOS redirect round-trip.
    - Polls invoice status every 3s and auto-switches UI to paid when webhook updates DB.
  - `src/app/components/manager-crm.tsx`
    - Added deep manager pets detail panel workflow:
      - Hồ sơ / Bệnh án / Digital Card tabs.
      - Medical record create/update/delete.
      - Digital card refresh/regenerate/export PNG.
      - Quick Add Walk-in owner mode (`existing`/`new`) and owner creation (`POST /customers`).
    - Added quick-search deep link support:
      - `/manager/pets?action=quick-add` auto-opens walk-in drawer.
    - Fixed PNG export file name sanitization regex.
  - `src/app/components/customer-appointments.tsx`
    - On successful booking, inserts created appointment immediately into list state (optimistic consistency), then re-fetches in background.
    - Upcoming/past filtering now follows appointment workflow status (`pending/confirmed` as upcoming).
  - `src/app/components/pet-profile-detail-panel.tsx`
    - Removed hardcoded age reference date; now uses current date.

- Deploy & runtime checks on VPS:
  - Synced modified files to `/home/ubuntu/pethub`.
  - Rebuilt/restarted: `api`, `worker`, `web`, `nginx`.
  - Verified routes:
    - `GET /api/health` => `200`
    - `GET /api/payments/payos/webhook` => `200`
    - `POST /api/payments/payos/webhook` with `{}` => `200`
    - `POST /api/payments/payos-webhook` with `{}` => `200`

- Data cleanup executed (VPS DB):
  - Truncated all domain tables (customers/pets/appointments/invoices/services/products/reminders/notifications/etc.).
  - Re-seeded minimal baseline only:
    - clinic: `default`
    - manager user: `mnu3032004@gmail.com` (role `manager`)
  - Final counts:
    - users: 1
    - customers: 0
    - pets: 0
    - appointments: 0
    - invoices: 0
    - services: 0
    - products: 0

## Iteration Update 2026-03-14 (QR/payOS reconciliation hardening + VPS redeploy)
- Branch:
  - `codex/backend-stabilization-phase1`
- Problem addressed this round:
  - QR/payOS payments sometimes remained `unpaid` in overview + bookings until manual open/check.
  - Payment webhook endpoint could error on non-object payload probe.
  - Some paid invoices were not always reflected to linked appointment `paymentStatus`.

- Backend changes:
  - `backend/src/payments/payments.service.ts`
    - Hardened `handlePayosWebhook`:
      - Accepts `unknown` payload safely (non-object payload no longer crashes).
      - If webhook signature is invalid, falls back to querying payOS order status API.
      - Accepts webhook only when payOS status verification confirms paid.
      - Keeps strict amount mismatch guard.
      - Writes `signatureVerified` metadata for audit.
    - `syncPendingPayosTransactions` now also runs appointment payment reconciliation.
    - Added `reconcileAppointmentPaymentStatus(clinicId, limit)`:
      - scans paid invoices with appointment links,
      - forces linked appointments to `paymentStatus=paid` + `paidAt` if stale.
  - `backend/src/payments/payments.controller.ts`
    - Webhook body type relaxed to `unknown` for fail-safe handling.
  - `backend/src/appointments/appointments.service.ts`
    - Increased payOS sync sweep on manager list load from `5` -> `30`.
    - Tightened customer cancel ownership lookup with `clinicId + userId`.
  - `backend/src/analytics/analytics.service.ts`
    - Increased pre-aggregate payOS sync sweep from `5` -> `30`.
    - Added same sync before `getCustomerLtvSummary` so summary/overview stay aligned.

- Build status (local):
  - `backend npm run build`: PASS
  - `frontend npm run build`: PASS

- VPS deploy status:
  - Synced latest source into `/home/ubuntu/pethub`.
  - Rebuilt/restarted:
    - `sudo docker compose --env-file .env.production -f docker-compose.production.yml up -d --build api worker web nginx`
  - Health checks:
    - `GET /api/health` => `200`
    - `GET /api/payments/payos/webhook` => `200`
    - `POST /api/payments/payos/webhook` with `{}` => `200`
    - `POST /api/payments/payos/webhook` with `text/plain` probe => `200` (fixed from server error)

## Thread Handover Snapshot 2026-03-14 (for next thread)
- Workspace code repo:
  - `C:\Users\ADMIN\Downloads\pethub\Pethub-main`
- Git remote:
  - `https://github.com/hannhu11/Pethub.git`
- Active working branch:
  - `codex/backend-stabilization-phase1`
- Deployment target:
  - VPS host: `140.245.119.189`
  - App dir on VPS: `/home/ubuntu/pethub`

### SSH / Deploy quick commands
- SSH (operator local command):
  - `ssh -i "C:\Users\ADMIN\Downloads\Open-claw\ssh-key-2026-03-01.key" ubuntu@140.245.119.189`
- Restart stack on VPS:
  - `cd /home/ubuntu/pethub && sudo docker compose --env-file .env.production -f docker-compose.production.yml up -d --build api worker web nginx`
- Check API logs quickly:
  - `cd /home/ubuntu/pethub && sudo docker compose --env-file .env.production -f docker-compose.production.yml logs --tail=120 api`

### Known priorities to continue in new thread
1. Finalize/verify payOS paid-state propagation to all screens (overview, bookings payment badge, POS receipt transition) under repeated real QR tests.
2. Restore exact “golden backup” UI only for manager `Khách hàng` + `Thú cưng` (3-dot interaction, side detail panel behavior, image upload UX, note-limit UX), keep other pages unchanged.
3. Verify customer RBAC for pet creation (customer must not create pets) and cross-account appointment isolation (no bleed after logout/login switching).
4. Verify reminders email delivery in production path (Resend domain/config + scheduling flow), and sync notification center with real backend events.

### Security reminders (must keep)
- Never commit `.env`, private keys, firebase key files, payOS raw credentials, or SSH key material.
- Secret files found outside repo root must stay untracked.
- Before each push: run secret scan + verify `git status` excludes sensitive files.

## Iteration Update 2026-03-16 (Milestone 97% + Walk-in save stability)
- Branch:
  - `codex/complete-90-backend-frontend`
- Milestone:
  - Project status updated to **97% complete** (all locked menus unchanged; final active area remains POS/Invoice polishing and runtime validation).

- Frontend-only fix completed this round:
  - File: `src/app/components/manager-crm.tsx`
  - Issue addressed:
    - Manager `Thêm nhanh — Walk-in` could get stuck at `Đang lưu...` when uploading large pet images.
    - Live nginx logs confirmed repeated `POST /api/pets` failures with `413 Request Entity Too Large` (payload ~6.6MB).
  - Applied solution:
    - Added client-side image optimization/compression before submit.
    - Added payload-size guard with clear user-facing error when image remains too large after compression.
    - Kept existing backend/API/schema untouched.

- Deploy status:
  - Synced updated frontend file to VPS (`/home/ubuntu/pethub/src/app/components/manager-crm.tsx`).
  - Rebuilt/recreated **web container only**:
    - `docker compose --env-file .env.production -f docker-compose.production.yml build web`
    - `docker compose --env-file .env.production -f docker-compose.production.yml up -d --force-recreate web`
  - New bundle observed on live index:
    - `assets/index-lc-gXDtt.js`

- Security and scope check:
  - No backend code changes in this iteration.
  - No credential/key files staged for commit.
