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
- **Claim** — N:1 with Policy (restrict delete — a claim can never be orphaned).
- **PremiumPayment** — N:1 with Policy.
- **Document** — N:1 with Customer.

See [`docs/authentication.md`](./docs/authentication.md),
[`docs/customer-management.md`](./docs/customer-management.md),
[`docs/policy-management.md`](./docs/policy-management.md), and
[`docs/premium-tracking.md`](./docs/premium-tracking.md) for module details.

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

This project follows a 14-day development plan. Current status: **Day 5 complete**
(Premium Tracking: record payments, dynamic overdue detection, payment history per policy,
search, filters, sorting, pagination, role-based access control, and a responsive frontend).
See `docs/` for what's planned in upcoming sessions.

## Known Issues

**Prisma engine binaries could not be downloaded in the original development sandbox** —
`binaries.prisma.sh` was not reachable from that environment's network egress rules, so
`prisma generate` / `prisma migrate dev` could not be run there. This is an environment
restriction, not a code or schema problem, and has held consistently across Days 2–5:

- Every schema change (Day 2's initial schema, Day 3's `Customer.deletedAt`, Day 4's Policy
  enums/renewal relation, Day 5's `PaymentStatus` enum and `dueDate`/`paymentMethod`/
  `transactionReference`/`remarks`) was hand-verified by applying the migration SQL directly to
  a local PostgreSQL instance — tables, enums, indexes, foreign keys, and constraints all
  confirmed correct.
- Day 5's dynamic overdue detection was verified end-to-end against the live database: a query
  mirroring the repository's `findOverdue` logic (`paymentStatus = PENDING AND dueDate < now()`)
  correctly returned only the genuinely-overdue payment among a PENDING-but-future, a
  PAID-but-past-due, and the target row — proving `status` alone or `dueDate` alone would have
  given the wrong answer, but the combination is correct. The `transactionReference` uniqueness
  constraint was also confirmed to reject duplicates.
- Password hashing, JWT, and all Zod validators (auth, customer, policy, and premium payment —
  including the amount-must-be-positive rule, the PAID-requires-paymentDate cross-field rule,
  and payment method/status enums) were verified in isolation with passing tests.
- TypeScript compiles cleanly except for lines that import types from `@prisma/client` —
  exactly the types `prisma generate` produces. These resolve automatically the moment
  `pnpm install` runs on a machine with normal internet access (a `postinstall` hook already
  runs `prisma generate` for you).
- The frontend is fully unaffected and was verified independently each day: typecheck, lint,
  format, and production build all pass with zero errors, and the dev server serves the full
  UI correctly.

**No action is needed from you** beyond running `pnpm install` in `backend/` on a normal
machine — everything will resolve itself.

## Contributing

This is a solo internship project developed session-by-session with AI pair-programming
(ChatGPT for architecture/planning, Claude for implementation). Each session's work is scoped
to specific days from the internship plan and committed as a self-contained change.

## License

Internal internship project — license to be finalized before any public release.
