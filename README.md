
# PetHub

PetHub includes:

- Frontend (`Vite + React`) in project root
- Backend (`NestJS + Prisma + PostgreSQL + Firebase Auth`) in `/backend`

## 1) Local development

### Frontend

```bash
npm i
cp .env.example .env
npm run dev
```

Required frontend env:
- `VITE_API_BASE_URL`
- `VITE_FIREBASE_*` (web app config from Firebase Console)

### Backend

```bash
cd backend
npm i
cp .env.example .env
npx prisma generate
npm run start:dev
```

## 2) Build checks

```bash
npm run build
npm --prefix backend run build
npm --prefix backend test -- --runInBand
```

## 3) Production deployment (Oracle VPS)

- Compose file: `/docker-compose.production.yml`
- Nginx route template: `/docker/nginx/pethub.conf`
- Logic audit: `/docs/LOGIC_AUDIT.md`
- Operations runbook: `/docs/ORACLE_PRODUCTION_RUNBOOK_VN.md`
- Go-live checklist: `/docs/GO_LIVE_24_7.md`
- Auth admin guide: `/docs/AUTH_ADMIN_GUIDE.md`

Bring up production stack:

```bash
docker compose -f docker-compose.production.yml -p pethub up -d --build
```

Troubleshooting public access on Oracle:
- If `curl http://127.0.0.1/api/health` works on VPS but `http://<public-ip>/api/health` times out, traffic is blocked before reaching the VM.
- Check the instance subnet uses the security list you edited.
- If VNIC has NSG attached, add ingress rules there too (`80`, `443`, source `0.0.0.0/0`).
- Keep OS firewall open (`iptables INPUT policy ACCEPT` or explicit allow rules).
- `4000` does not need to be public; keep it internal behind Nginx.

## Security baseline

- Never commit `.env*`, Firebase service account JSON, or private keys.
- Rotate all previously exposed keys before go-live.
- Set `AUTH_MOCK_ENABLED=false` in production.
- Set `DEFAULT_SENSITIVE_PASSWORD` to a strong value (minimum 12 chars) if password hash is not initialized.

## 4) Production architecture

- `app.<domain>` -> frontend container
- `api.<domain>` -> NestJS API container
- PostgreSQL is source of truth (business data)
- Redis for queue/realtime support
- Firebase for authentication tokens
- payOS/VietQR for subscription payment flow
- Gemini for reminder text generation
