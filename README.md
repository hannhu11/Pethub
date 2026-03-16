
# PetHub (Public Submission)

PetHub is a pet-care platform with:

- Frontend: `Vite + React + TypeScript`
- Backend: `NestJS + Prisma + PostgreSQL + Redis`
- Authentication: Firebase (ID token verification)

This repository is prepared for **public sharing** and does not include private secrets.

Milestone status: **99% completed**.

## Project structure

- `/src`: frontend application
- `/backend`: backend API
- `/docker`: container and Nginx configs
- `/docs`: technical and deployment notes

## Local setup

## 1) Frontend

```bash
npm install
cp .env.example .env
npm run dev
```

Required frontend env values:

- `VITE_API_BASE_URL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

## 2) Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npm run start:dev
```

## Build and test

```bash
npm run build
npm --prefix backend run build
npm --prefix backend test -- --runInBand
```

## Environment and secret policy

- Do not commit `.env`, `.env.production`, or any private key files.
- Use only template files: `.env.example`, `.env.production.example`, `backend/.env.example`.
- Keep all sensitive values empty in repository files and fill them only in deployment environment.
- Rotate all credentials if any key was ever exposed.

## Deployment references

- `docker-compose.production.yml`
- `docker/nginx/pethub.conf`
- `docs/ORACLE_PRODUCTION_RUNBOOK_VN.md`
- `docs/GO_LIVE_24_7.md`

Example production command:

```bash
docker compose -f docker-compose.production.yml -p pethub up -d --build
```

## Notes for graders/reviewers

- This public submission intentionally excludes private operational materials and machine-specific secrets.
- To run the project, provide your own environment variables in local `.env` files based on the templates.
