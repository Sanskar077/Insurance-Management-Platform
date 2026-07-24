# Policy Management Module

## Policy numbers

Human-readable policy numbers (`POL-<year>-000001`) are generated from a dedicated PostgreSQL
sequence (`policy_number_seq`, created in the Day 4 migration) — the sequence is global and
monotonically increasing (not reset per calendar year), so uniqueness is guaranteed by the
database itself rather than application-level retry logic. The UUID remains the internal
primary key and foreign key target throughout; `policyNumber` is purely a display value.

## Renewal design

Renewing a policy **creates a new `Policy` row** rather than mutating the existing one:

1. The original policy's `status` is set to `RENEWED`. Its `startDate`/`endDate` and every
   other field are left untouched — it remains a permanent, accurate record of that period.
2. A new `Policy` row is created for the new period (new `policyNumber`, `status: ACTIVE`),
   linked back to the original via `renewedFromId`.

Both writes happen in a single Prisma transaction. This was chosen over an in-place update
because the spec explicitly requires "maintain history, do not lose previous dates" — mutating
the original row's dates would destroy that history, and a separate `PolicyHistory` table would
have meant modifying unrelated schema beyond what Day 4 authorized. The self-relation
(`renewedFromId` → `Policy.id`) keeps this within the existing `Policy` model.

A policy can only be renewed while its status is `ACTIVE` or `EXPIRED`. Attempting to renew a
`CANCELLED` or already-`RENEWED` policy returns `400 Bad Request` (per the spec's "cancelled
policies cannot be renewed without explicit renewal logic" rule — there is no such explicit
override implemented, so it's a hard block).

## Cancellation vs. deletion — two distinct mechanisms

- **`POST /:id/cancel`** — business action. Sets `status: CANCELLED`. The policy remains fully
  visible in lists and search; it just carries a `CANCELLED` badge in the UI.
- **`DELETE /:id`** — administrative soft delete. Sets `deletedAt`, and the row is excluded from
  all normal queries afterward (mirroring the Customer module's soft-delete pattern). ADMIN only.

These are independent: a cancelled policy is not automatically deleted, and a deleted policy
doesn't need to have been cancelled first.

## Expiry tracking

Every policy DTO includes a computed `isExpired` boolean (`endDate < now()`), calculated at
read time — there's no background job or cron flipping `status` to `EXPIRED` automatically
(explicitly out of scope: no "Notifications" per the Day 4 exclusions). The list endpoint also
accepts an `expired=true|false` query filter for real-time filtering independent of the stored
`status` field, since a policy can be past its end date while still technically `ACTIVE` in the
database until someone acts on it.

## Endpoints

| Method | Path                       | Roles                                | Notes                                                         |
| ------ | -------------------------- | ------------------------------------ | ------------------------------------------------------------- |
| POST   | `/api/policies`            | ADMIN, AGENT                         | `customerId` must reference an existing, non-deleted customer |
| GET    | `/api/policies`            | ADMIN, AGENT, CUSTOMER (self-scoped) | search, filters, sort, pagination                             |
| GET    | `/api/policies/:id`        | ADMIN, AGENT, CUSTOMER (self only)   |                                                               |
| PUT    | `/api/policies/:id`        | ADMIN, AGENT                         | CUSTOMER has view-only access per spec — no self-update route |
| POST   | `/api/policies/:id/cancel` | ADMIN, AGENT                         | idempotency guarded — already-cancelled returns 400           |
| POST   | `/api/policies/:id/renew`  | ADMIN, AGENT                         | creates a new policy row, see above                           |
| DELETE | `/api/policies/:id`        | ADMIN only                           | soft delete                                                   |

## Search, filters, sorting, pagination

- `search` — matches `policyNumber` (contains, case-insensitive), `policyType` (exact, matched
  case-insensitively by uppercasing input), or the linked customer's `fullName` (contains,
  case-insensitive) via a relation filter.
- `status` — exact match against `PolicyStatus`.
- `policyType` — exact match against `PolicyType`.
- `expired` — `true`/`false`, filters on `endDate` independent of `status` (see above).
- `sortBy` — `startDate` | `endDate` | `premiumAmount`; `sortOrder` — `asc` | `desc`.
- `page` / `limit` — same pagination shape as Customer Management
  (`currentPage`, `totalPages`, `totalRecords`, `hasNext`, `hasPrevious`).

## Frontend

| Route                 | Page                                                                                                                                                        |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/policies`           | List — search, status/type filters, table with status badges                                                                                                |
| `/policies/new`       | Create — includes a searchable `CustomerPicker` (reuses the customer search API); supports `?customerId=` prefill for linking from a customer's detail page |
| `/policies/:id`       | Detail — full policy view, renewal-lineage link, history placeholder                                                                                        |
| `/policies/:id/edit`  | Edit                                                                                                                                                        |
| `/policies/:id/renew` | Dedicated renewal form — pre-fills the new start date from the current end date and defaults the new end date to one year later; both are editable          |

Same UI kit as Customer Management, plus two new reusable components added this session:
`StatusBadge` (color-coded by status value) and `Select` (form dropdown matching `Input` styling).
