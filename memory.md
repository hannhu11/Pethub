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
