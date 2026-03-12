# Oracle VPS Production Runbook (Vietnam Launch)

Last updated: 2026-03-12

## 1) Target Architecture

- Frontend: Vite app (`app.<domain>`)
- Backend API: NestJS (`api.<domain>`)
- Database: PostgreSQL on Oracle VPS
- Queue/Cache: Redis
- Realtime: WebSocket via Nest gateway
- Auth: Firebase Auth (ID token + Firebase Admin verify)
- AI: Gemini API
- Subscription payment: payOS/VietQR

## 2) Parallel Deployment with Existing OpenClaw

Do not remove old stack. Run PetHub in parallel:

1. Keep OpenClaw nginx routes untouched.
2. Add PetHub routes:
   - `app.<domain>` -> `pethub-web`
   - `api.<domain>` -> `pethub-api`
3. Use dedicated compose project name:
   - `docker compose -f docker-compose.production.yml -p pethub up -d`

## 3) Recommended Oracle Region

Use Singapore region for Vietnam traffic to minimize latency.

## 4) Server Hardening

1. Create non-root deploy user.
2. Enable firewall:
   - allow `22`, `80`, `443`
3. Install fail2ban.
4. Disable password login for SSH and use key auth.
5. Keep OS patched (`apt update && apt upgrade`).

## 5) Required Environment Values

Set values before boot:

- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- Firebase credentials (`FIREBASE_SERVICE_ACCOUNT_JSON` or `FIREBASE_*`)
- `GEMINI_API_KEY`
- payOS keys (`PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`)

## 6) First Boot

```bash
docker compose -f docker-compose.production.yml -p pethub up -d --build
docker compose -f docker-compose.production.yml -p pethub logs -f api
```

Health check:

- API: `GET http://api.<domain>/api/health`

## 7) Database Backup (Daily)

Use cron:

```bash
0 2 * * * docker exec pethub-postgres pg_dump -U pethub pethub > /opt/backups/pethub-$(date +\%F).sql
```

Upload backup files to OCI Object Storage (Singapore bucket).

## 8) Restore Drill (Mandatory)

Monthly restore test:

1. Create temporary database/container.
2. Restore latest dump.
3. Run smoke queries.
4. Document restore time and issues.

## 9) Monitoring & Alerts

Track:

- container up/down
- API health endpoint
- Postgres storage growth
- Redis memory
- queue backlog
- CPU/RAM

Send alerts to Telegram or Email.

## 10) Go-live Gate

Before switching traffic:

1. `npm run build` passes for frontend and backend.
2. Booking conflict test returns `409` on double slot.
3. POS checkout creates immutable invoice.
4. Notification unread lifecycle works with websocket.
5. payOS webhook updates subscription state.
