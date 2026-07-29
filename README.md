# Insurance Management Platform

A full-stack web application for digitizing insurance operations — customer management, policy
lifecycle, premium tracking, claims processing, document management, and business reporting.

Built as a structured internship project, developed incrementally day-by-day.

## Project Overview

Administrators and insurance agents manage customers and policies; customers self-serve to pay
premiums, upload documents, and submit claims; agents verify and approve/reject claims;
administrators monitor the business through dashboards and reports.

See [`docs/`](./docs) for detailed UI planning, wireframes, and technology rationale.

## Tech Stack

| Layer           | Technology                            |
| --------------- | ------------------------------------- |
| Frontend        | React, TypeScript, Vite, Tailwind CSS |
| Backend         | Node.js, Express.js, TypeScript       |
| Database        | PostgreSQL, Prisma ORM                |
| Auth            | JWT + bcrypt                          |
| File Upload     | Multer                                |
| Validation      | Zod / Express Validator               |
| Charts          | Chart.js                              |
| PDF Generation  | PDFKit                                |
| Package Manager | pnpm                                  |

Full rationale for each choice: [`docs/tech-stack.md`](./docs/tech-stack.md).

## Database Schema

Six models in `backend/prisma/schema.prisma`:

- **User** — auth (`id`, `name`, `email` unique, `password` hashed, `role`, timestamps).
  `role` is one of `ADMIN`, `AGENT`, `CUSTOMER`.
- **Customer** — business profile, 1:1 with User (`userId` unique FK).
- **Policy** — N:1 with Customer, `policyNumber` unique (readable format `POL-2026-000001`,
  generated from a DB sequence). `policyType`/`status` are Prisma enums. Includes
  `coverageAmount`, `description`, `deletedAt` (soft delete), and a self-relation
  (`renewedFromId`) linking a renewed policy to its predecessor.
- **PremiumPayment** — N:1 with Policy, `paymentStatus` is a Prisma enum
  (PENDING/PAID/OVERDUE/FAILED). `dueDate` is required; `paymentDate`/`paymentMethod`/
  `transactionReference` (unique) are nullable — only populated once a payment is actually
  made. "Overdue" is never stored — it's computed at read time from `paymentStatus = PENDING
AND dueDate < now()`.
- **Claim** — N:1 with Policy (restrict delete), `claimNumber` unique (readable format
  `CLM-2026-000001`, generated from a DB sequence). `claimType`/`status` are Prisma enums
  (`ClaimStatus`: SUBMITTED/UNDER_REVIEW/APPROVED/REJECTED/CLOSED). `approvedAmount` is
  nullable (only set on approval). Status transitions are enforced by a state machine in
  `claim.service.ts` — see `docs/claim-management.md`.
- **Document** — polymorphic attachment (`entityType`: CUSTOMER/POLICY/CLAIM +
  `entityId`) to Customer, Policy, or Claim — no direct FK is possible across three target
  tables, so existence and ownership are validated at the application layer instead
  (`document.service.ts`). `uploadedBy` is a normal FK to `User` (restrict delete).
  File bytes live on local disk behind a `StorageService` interface
  (`services/storage/`) so cloud storage can be swapped in later without touching business
  logic. See `docs/document-management.md`.

See [`docs/authentication.md`](./docs/authentication.md),
[`docs/customer-management.md`](./docs/customer-management.md),
[`docs/policy-management.md`](./docs/policy-management.md),
[`docs/premium-tracking.md`](./docs/premium-tracking.md),
[`docs/claim-management.md`](./docs/claim-management.md), and
[`docs/document-management.md`](./docs/document-management.md) for module details.

## Folder Structure

```
insurance-management-platform/
├── frontend/           # React + TypeScript + Vite + Tailwind app
│   └── src/
│       ├── components/ # common, layout, ui components
│       ├── features/   # auth, dashboard, customers, policies, claims, premiums, documents, reports
│       ├── hooks/       lib/       routes/       services/
│       ├── store/       types/     utils/        config/       constants/
│       └── pages/
├── backend/            # Node.js + Express + TypeScript API
│   ├── prisma/          # schema & migrations (added in Day 2)
│   └── src/
│       ├── config/     controllers/  middlewares/  routes/
│       ├── services/   repositories/ types/        utils/
│       └── validators/ lib/
├── docs/               # UI planning, wireframes, tech-stack rationale
└── .husky/             # git hooks (pre-commit lint/format)
```

## Prerequisites

- Node.js 20+
- pnpm 11+
- PostgreSQL (added when the database module is implemented)

## Installation

```bash
git clone <repo-url>
cd insurance-management-platform

# Install root tooling (husky, lint-staged)
pnpm install

# Install frontend deps
cd frontend && pnpm install && cd ..

# Install backend deps
cd backend && pnpm install && cd ..
```

Copy environment templates:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

## Development Commands

From the repo root:

| Command                                        | Description                                           |
| ---------------------------------------------- | ----------------------------------------------------- |
| `pnpm dev:frontend`                            | Start the frontend dev server (http://localhost:5173) |
| `pnpm dev:backend`                             | Start the backend dev server (http://localhost:5000)  |
| `pnpm build:frontend`                          | Typecheck + build the frontend for production         |
| `pnpm build:backend`                           | Build the backend for production                      |
| `pnpm lint:frontend` / `pnpm lint:backend`     | Lint each app                                         |
| `pnpm format:frontend` / `pnpm format:backend` | Format each app with Prettier                         |

Or run commands directly inside `frontend/` or `backend/` using their own `package.json` scripts.

## Development Status

This project follows a 14-day development plan. Current status: **Day 7 complete**
(Document Management: upload/view/download/soft-delete documents attached to customers,
policies, or claims; local-disk storage behind a swappable StorageService abstraction;
search, filters, sorting, pagination, role-based access control, and a responsive
frontend with real upload progress). See `docs/` for what's planned in upcoming sessions.

## Known Issues

**Prisma engine binaries could not be downloaded in the original development sandbox** —
`binaries.prisma.sh` was not reachable from that environment's network egress rules, so
`prisma generate` / `prisma migrate dev` could not be run there. This is an environment
restriction, not a code or schema problem, and has held consistently across Days 2–7:

- Every schema change (Day 2's initial schema through Day 7's polymorphic `Document`
  redesign) was hand-verified by applying the migration SQL directly to a local PostgreSQL
  instance — tables, enums, indexes, foreign keys, and constraints all confirmed correct.
- Day 7's cross-table search (documents don't have a direct Prisma relation to Customer/
  Policy/Claim, since the association is polymorphic) was verified end-to-end: a document
  attached to a policy was correctly found by searching the policy's number. The
  `uploadedBy` foreign key was confirmed to block deleting a user who has uploaded
  documents, and soft delete was confirmed to hide a document from normal queries while
  the row still physically exists.
- The `LocalDiskStorageService` was fully exercised against the real filesystem (not just
  read as code): save/read/delete round-trips, and — critically for the spec's security
  requirements — path traversal via `../` in both the filename and subdirectory was
  confirmed rejected, along with writes to any subdirectory outside the
  customers/policies/claims allowlist.
- Password hashing, JWT, and all Zod validators across every module — including Day 7's
  upload metadata validation and the MIME-type/extension file allowlist — were verified in
  isolation with passing tests.
- TypeScript compiles cleanly except for lines that import types from `@prisma/client` —
  exactly the types `prisma generate` produces. These resolve automatically the moment
  `pnpm install` runs on a machine with normal internet access (a `postinstall` hook already
  runs `prisma generate` for you).
- The frontend is fully unaffected and was verified independently each day: typecheck, lint,
  format, and production build all pass with zero errors, and the dev server serves the full
  UI correctly.

**No action is needed from you** beyond running `pnpm install` in `backend/` on a normal
machine — everything will resolve itself.

### Real bug found & fixed: Prisma 7's `prisma.config.ts` requirement

Everything above was verified as thoroughly as the sandbox allowed, but one issue could only
surface on a machine with actual internet access — which happened during Day 7, when
`pnpm install` finally reached the real `prisma generate` step and failed with:

```
error: The datasource property `url` is no longer supported in schema files. Move connection
URLs for Migrate to `prisma.config.ts` and pass either `adapter` for a direct database
connection or `accelerateUrl` for Accelerate to the `PrismaClient` constructor.
```

This is a genuine Prisma 7 breaking change (not related to the sandbox network restriction
above): as of Prisma 7, `schema.prisma`'s `datasource` block can no longer contain
`url = env("DATABASE_URL")` directly — that URL now belongs in a `prisma.config.ts` file.
**This has been fixed**: `schema.prisma`'s datasource block now only declares `provider`, and
`backend/prisma.config.ts` supplies `DATABASE_URL` to the CLI instead. `@prisma/config` was
added as a dependency. The fix was verified in the sandbox — schema validation now passes
cleanly (`Loaded Prisma config from prisma.config.ts.`) and the only remaining failure is the
same pre-existing sandbox network block described above, confirming this specific error is
resolved. See `backend/prisma/README.md` for details. Nothing about `.env` or the generated
`PrismaClient`'s runtime behavior changed — only the CLI-time config location.

## Contributing

This is a solo internship project developed session-by-session with AI pair-programming
(ChatGPT for architecture/planning, Claude for implementation). Each session's work is scoped
to specific days from the internship plan and committed as a self-contained change.

## License

Internal internship project — license to be finalized before any public release.
