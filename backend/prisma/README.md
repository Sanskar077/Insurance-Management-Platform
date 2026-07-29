# Prisma

`schema.prisma` defines six models: `User`, `Customer`, `Policy`, `Claim`, `PremiumPayment`,
`Document`, plus a `Role` enum (`ADMIN`, `AGENT`, `CUSTOMER`). See the root README's
"Database Schema" section for the full relationship diagram.

## Configuration (`prisma.config.ts`)

Prisma 7 removed support for writing `url = env("DATABASE_URL")` directly inside
`schema.prisma`'s `datasource` block (error `P1012`). The connection URL now lives in
`backend/prisma.config.ts` instead, read by every `prisma` CLI command (`generate`,
`migrate`, `studio`, etc.). This does **not** change anything about the generated
`PrismaClient` at runtime — it still reads `DATABASE_URL` from `process.env` exactly as
before (`src/lib/prisma.ts`) — so nothing in `.env` or your deployment setup needs to change,
only the CLI-time config file. If you see `P1012` again after pulling changes, confirm
`prisma.config.ts` exists at the `backend/` root and that `@prisma/config` is installed
(`pnpm add -D @prisma/config`).

## Migrations

`migrations/20260721074141_init/migration.sql` creates all tables, the `Role` enum, unique
constraints, indexes, and foreign keys. It was authored to match `schema.prisma` exactly and
applied directly against a local PostgreSQL instance to verify correctness (see root README's
"Known Issues" section for why `prisma migrate dev` couldn't be run directly in the original
development sandbox — this does not affect running it normally on your machine).

## First-time setup on a machine with normal internet access

```bash
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET
pnpm install            # runs `prisma generate` automatically via postinstall
pnpm db:migrate:deploy  # applies the existing migration (recognized as already-applied
                         # if using the same database this was tested against, otherwise
                         # applies fresh to a new database)
```

If starting against a brand-new empty database, `prisma migrate deploy` will run
`migration.sql` fresh and create everything from scratch — no manual steps needed.
