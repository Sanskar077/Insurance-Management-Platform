# Deployment Guide

Production deployment reference for the Insurance Management Platform
(React + Vite frontend, Express + Prisma backend, PostgreSQL).

---

## 1. Prerequisites

- Node.js ≥ 22 and pnpm ≥ 9 (bare-metal), **or** Docker + Docker Compose
- A PostgreSQL 14+ database
- A strong `JWT_SECRET` (≥ 32 chars): `openssl rand -hex 48`

## 2. Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | yes | `production` |
| `PORT` | no (5000) | API listen port |
| `DATABASE_URL` | yes | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | yes | ≥ 32 characters |
| `JWT_EXPIRES_IN` | no (`1d`) | jsonwebtoken expiry string |
| `CLIENT_ORIGIN` | yes | Frontend origin for CORS, e.g. `https://app.example.com` |

The server validates all of these at startup (`src/config/env.ts`) and
**exits immediately** with a readable message if any are missing/invalid.

### Frontend (build-time)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | yes | Public API base, e.g. `https://api.example.com/api` |

Vite bakes this in at `pnpm build` time — rebuild to change it.

## 3. Option A — Docker Compose (recommended)

From the repository root:

```bash
# 1. Create a root .env for compose
cat > .env <<'EOF'
POSTGRES_PASSWORD=<strong-db-password>
JWT_SECRET=<openssl rand -hex 48>
CLIENT_ORIGIN=http://localhost:8080
VITE_API_BASE_URL=http://localhost:5000/api
EOF

# 2. Build and start everything
docker compose up -d --build
```

- Frontend: http://localhost:8080 (nginx, SPA fallback, hashed-asset caching)
- API: http://localhost:5000/api (health check at `/api/health`)
- Database migrations run automatically on backend start (`prisma migrate deploy`)
- Named volumes: `pgdata` (database), `uploads` (documents)

## 4. Option B — bare metal

```bash
# Backend
cd backend
pnpm install --frozen-lockfile        # runs prisma generate
cp .env.example .env                  # fill in values
pnpm db:migrate:deploy                # apply committed migrations
pnpm build
NODE_ENV=production node dist/server.js

# Frontend
cd frontend
pnpm install --frozen-lockfile
VITE_API_BASE_URL=https://api.example.com/api pnpm build
# serve dist/ with any static server; SPA fallback to index.html required
```

## 5. First-run bootstrap

On an empty database no ADMIN exists yet. The **first** staff registration
is allowed through `POST /api/auth/register` with `role: "ADMIN"` — after
that, all staff accounts must be created by an ADMIN via User Management
(`/users` in the UI). Customer self-registration stays open.

## 6. Operational notes

- **Graceful shutdown**: SIGINT/SIGTERM close the HTTP server, then the
  database pool.
- **Uploads**: stored on local disk under `backend/uploads/` via the
  `StorageService` abstraction — mount a persistent volume in production.
  Swapping to S3/Azure later only requires a new `StorageService`
  implementation.
- **Security**: helmet, CORS restricted to `CLIENT_ORIGIN`, JWT auth on all
  API routes, central permission matrix (`src/constants/permissions.ts`),
  Zod validation on every input, soft deletes throughout.
- **Logs**: morgan `combined` format in production plus leveled app logs
  (`utils/logger.ts`); unexpected errors never leak internals to clients.

## 7. Verification checklist

1. `GET /api/health` returns `{ "status": "ok" }`
2. Login works and `/dashboard` renders KPIs
3. `docker compose logs backend` shows `Server running … (production)`
4. Uploaded documents survive a `docker compose restart`
5. Backend tests: `cd backend && pnpm test` (needs `DATABASE_URL`)
6. Frontend tests: `cd frontend && pnpm test`
