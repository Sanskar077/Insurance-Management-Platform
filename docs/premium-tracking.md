# Premium Tracking Module

## Overdue detection — computed, never stored

Per the spec's explicit instruction, there is **no `isOverdue` column**. Overdue status is
calculated at read time everywhere it's needed:

```
paymentStatus === 'PENDING' AND dueDate < now()
```

This appears in three places, all sharing the same logic:

- `PremiumPaymentDto.isOverdue` (computed in `toPremiumPaymentDto`, included on every payment
  returned by any endpoint)
- `GET /premium-payments/overdue` (repository's `findOverdue`, same predicate as a `WHERE` clause)
- The frontend's `isOverdue` flag on each row, and the dedicated Overdue Premiums page

This was verified end-to-end against a live PostgreSQL instance with three payments in
different states (PENDING+past-due, PENDING+future-due, PAID+past-due) — only the first was
returned as overdue, confirming the combination of both conditions is required (status alone
or date alone would give a wrong answer for the other two cases).

## Payment immutability vs. administrative correction

The spec requires payment history stay immutable "except where administrative corrections are
required." This is modeled as two different update paths on the same `PUT /premium-payments/:id`
route, selected by the caller's role:

- **AGENT** — restricted to `updatePaymentStatusSchema` (`paymentStatus`, plus `paymentDate`/
  `transactionReference` since those naturally change together when a payment clears). Matches
  the spec's Agent responsibility: "Update payment status if required by business rules."
- **ADMIN** — full `updatePremiumPaymentSchema` (any field), for administrative corrections.

Same `validateBodyByRole` middleware pattern already used for Customer Management's
role-restricted update — no new mechanism introduced.

## Business rules enforced

- `policyId` must reference an existing policy (`400` if not).
- Payments cannot be recorded against a `CANCELLED` policy (hard block — the spec's "unless
  future business rules explicitly allow it" has no such override implemented yet).
- `amount` must be strictly greater than zero (Zod `.positive()` — stricter than Policy's
  `premiumAmount`/`coverageAmount`, which only exclude negatives, per this module's own spec
  wording "greater than zero").
- `paymentDate`, when provided, cannot be before the policy's `startDate`.
- `transactionReference`, when provided, must be unique across all payments (`409` on
  duplicate) — enforced by both a Zod check in the service layer and a DB unique constraint as
  a second line of defense.
- If `paymentStatus` is submitted as `PAID` on creation, `paymentDate` is required (cross-field
  Zod refinement) — a payment can't be marked paid without saying when.

## Endpoints

| Method | Path                               | Roles                                | Notes                             |
| ------ | ---------------------------------- | ------------------------------------ | --------------------------------- |
| POST   | `/api/premium-payments`            | ADMIN, AGENT                         |                                   |
| GET    | `/api/premium-payments`            | ADMIN, AGENT, CUSTOMER (self-scoped) | search, filters, sort, pagination |
| GET    | `/api/premium-payments/overdue`    | ADMIN, AGENT, CUSTOMER (self-scoped) | dynamic, see above                |
| GET    | `/api/premium-payments/:id`        | ADMIN, AGENT, CUSTOMER (self only)   |                                   |
| PUT    | `/api/premium-payments/:id`        | ADMIN (full), AGENT (status-only)    | see immutability section above    |
| GET    | `/api/policies/:policyId/payments` | ADMIN, AGENT, CUSTOMER (self only)   | payment history for one policy    |

`GET /premium-payments/overdue` is registered before the `/:id` route (same pattern as
Customer Management's `/me`) so `"overdue"` isn't parsed as a payment id.

## Search, filters, sorting, pagination

- `search` — matches `transactionReference`, the linked policy's `policyNumber`, or the linked
  customer's `fullName` (all `contains`, case-insensitive) via relation filters.
- `paymentStatus` — exact match.
- `paymentMethod` — exact match. Not a Prisma enum (only `PaymentStatus` was required as one
  per the spec) — validated at the application layer against a fixed set
  (CASH/CARD/BANK_TRANSFER/UPI/CHEQUE/OTHER) instead.
- `dateFrom` / `dateTo` — range filter on `dueDate`.
- `sortBy` — `dueDate` | `paymentDate` | `amount`; `sortOrder` — `asc` | `desc`.
- Same pagination shape as Customer/Policy Management.

## Frontend

| Route                       | Page                                                                       |
| --------------------------- | -------------------------------------------------------------------------- |
| `/premium-payments`         | List — search, status/method filters, table with overdue indicator         |
| `/premium-payments/new`     | Record Payment — supports `?policyId=` prefill from a policy page          |
| `/premium-payments/:id`     | Details — includes an inline status-update control for ADMIN/AGENT         |
| `/premium-payments/overdue` | Overdue Premiums — dedicated view with "days overdue"                      |
| `/policies/:id/payments`    | Payment History — scoped to one policy, linked from the policy detail page |

No new reusable UI components were needed this session — `Select`, `StatusBadge`, `Pagination`,
`SearchBar`, `EmptyState`, `ErrorState`, and `Spinner` (all introduced in Days 3–4) covered
every need.
