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
