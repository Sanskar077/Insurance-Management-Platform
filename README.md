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

This project follows a 14-day development plan. Current status: **Day 1 complete**
(project scaffolding, tooling, and planning docs). See `docs/` for what's planned in upcoming
sessions.

## Contributing

This is a solo internship project developed session-by-session with AI pair-programming
(ChatGPT for architecture/planning, Claude for implementation). Each session's work is scoped
to specific days from the internship plan and committed as a self-contained change.

## License

Internal internship project — license to be finalized before any public release.
