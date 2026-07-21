# Technology Stack — Rationale

Documented for future maintainers to understand why each technology was chosen.

## Frontend

**React (with TypeScript)**
Component-based architecture fits the app's many repeated UI patterns (tables, forms, cards
across three role-based dashboards). TypeScript catches data-shape mismatches (e.g. a Policy
missing a required field) at compile time rather than in production.

**Vite**
Fast dev-server startup and hot module replacement compared to older bundlers; minimal config
needed to get TypeScript + React + Tailwind working together.

**Tailwind CSS**
Utility-first styling keeps the three different dashboards (Admin/Agent/Customer) visually
consistent without maintaining large separate CSS files per screen, and makes responsive/dark-mode
variants straightforward via class modifiers.

## Backend

**Node.js + Express.js (with TypeScript)**
Express is minimal and unopinionated, which suits a REST API with clearly separated modules
(customers, policies, claims, premiums, documents, reports). TypeScript on the backend keeps
request/response shapes and database models in sync with the frontend's types.

**PostgreSQL**
The domain is inherently relational — customers have many policies, policies have many claims
and payments, with real foreign-key constraints that matter (e.g. a claim must reference a valid
policy). PostgreSQL enforces this integrity and handles reporting-style aggregate queries well.

**Prisma ORM**
Type-safe query building that generates TypeScript types directly from the schema, reducing
drift between the database and backend code. Migrations are tracked and reviewable in git.

## Authentication & Security

**JWT + bcrypt**
JWT allows stateless authentication suited to a REST API consumed by a separate frontend origin.
bcrypt is the standard for password hashing (adaptive cost factor, salted by default).

## File Handling

**Multer**
Standard Express middleware for handling `multipart/form-data`, needed for identity documents,
policy documents, and claim attachments.

## Validation

**Zod / Express Validator**
Runtime validation is required because TypeScript types are erased at runtime — incoming request
bodies must still be validated. Zod additionally allows deriving TypeScript types from schemas,
keeping validation and typing in one place.

## Reporting

**Chart.js**
Lightweight charting library sufficient for the dashboard's needs (policy counts, claim
statistics, premium collection trends) without the overhead of a larger visualization library.

**PDFKit**
Enables generating downloadable PDF reports and policy documents directly from the backend.

## Tooling

**pnpm** — faster installs and disk-efficient via content-addressable storage; strict
dependency resolution avoids phantom dependencies.

**ESLint + Prettier** — consistent code style and early error detection across a team-style
workflow (even though currently AI-assisted, the same discipline applies).

**Husky + lint-staged** — enforces lint/format checks at commit time so issues are caught before
they reach the repository, keeping every commit in a working state.

## Deployment

**Render/Railway (backend), Vercel (frontend)** — both offer straightforward Git-based deploys
with free/low-cost tiers suitable for an internship-scale project, and both integrate cleanly with
a PostgreSQL add-on or external managed database.
