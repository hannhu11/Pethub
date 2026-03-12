
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

Bring up production stack:

```bash
docker compose -f docker-compose.production.yml -p pethub up -d --build
```

## 4) Production architecture

- `app.<domain>` -> frontend container
- `api.<domain>` -> NestJS API container
- PostgreSQL is source of truth (business data)
- Redis for queue/realtime support
- Firebase for authentication tokens
- payOS/VietQR for subscription payment flow
- Gemini for reminder text generation
