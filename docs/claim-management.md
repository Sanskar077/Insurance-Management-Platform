# Claim Management Module

## Workflow state machine

```
SUBMITTED ──┬──> UNDER_REVIEW ──┬──> APPROVED ──> CLOSED
            │                   │
            └───────────────────┴──> REJECTED ──> CLOSED
```

Enforced centrally in `claim.service.ts` via an `ALLOWED_TRANSITIONS` map — every mutating
action (`update`, `approve`, `reject`, `close`) checks the current status against this map
before writing, so no route can push a claim through an invalid transition (e.g. `APPROVED`
straight to `REJECTED`, or anything out of `CLOSED`). The frontend mirrors this exact map
(`ALLOWED_TRANSITIONS` in `types/claim.types.ts`) to decide which action buttons to show on the
claim detail page, so the UI and API never disagree about what's currently allowed.

## Design note: the "review" transition and its endpoint

The Day 6 REST API list doesn't include a standalone "start review" endpoint, only
`PUT /claims/:id`, `/approve`, `/reject`, and `/close` — yet the workflow diagram explicitly
shows `SUBMITTED → UNDER_REVIEW` as a real step, and the spec lists "Review claim" as an Agent
responsibility. Rather than invent an unrequested route, the `UNDER_REVIEW` transition was
folded into the existing general-update endpoint: `PUT /claims/:id` accepts an optional
`status` field whose only legal value is the literal `"UNDER_REVIEW"` (enforced by
`z.literal('UNDER_REVIEW')` in the validator). This was a judgment call made to stay within the
spec's literal endpoint list — flagging it here in case a dedicated endpoint is preferred
instead.

## Claim numbers

Human-readable claim numbers (`CLM-<year>-000001`) are generated the same way as Day 4's policy
numbers — a dedicated PostgreSQL sequence (`claim_number_seq`), global and monotonically
increasing. See `utils/claimNumber.ts`, which mirrors `utils/policyNumber.ts` exactly.

## Business rules enforced

- `policyId` must reference an existing policy (`400` if not).
- Claims cannot be created against a `CANCELLED` policy.
- A CUSTOMER may only file a claim against their own policy, and only while that policy's
  status is `ACTIVE` (not merely "not cancelled" — the spec's Customer authorization section
  says "for their own **active** policies", a stricter rule than the general
  not-cancelled rule that applies to ADMIN/AGENT-created claims).
- `claimAmount` must be strictly greater than zero.
- `approvedAmount` (set only via `/approve`) cannot exceed `claimAmount` — checked in the
  service using the existing claim's stored amount, not a client-supplied value.
- `incidentDate` cannot be after `claimDate` — validated on create (Zod cross-field
  refinement) and re-validated on update (service-level, since `claimDate` itself isn't
  editable but `incidentDate` is, so a bad edit could otherwise slip through the original
  create-time check).
- Closed claims cannot be modified — checked before any field update, independent of the
  transition map (a `CLOSED` claim also happens to have no outgoing transitions in the map, but
  this rule is enforced as its own explicit check for clarity).

## Endpoints

| Method | Path                      | Roles                                | Notes                                                                 |
| ------ | ------------------------- | ------------------------------------ | --------------------------------------------------------------------- |
| POST   | `/api/claims`             | ADMIN, AGENT, CUSTOMER               | CUSTOMER restricted to own active policies                            |
| GET    | `/api/claims`             | ADMIN, AGENT, CUSTOMER (self-scoped) | search, filters, sort, pagination, `policyId` filter                  |
| GET    | `/api/claims/:id`         | ADMIN, AGENT, CUSTOMER (self only)   |                                                                       |
| PUT    | `/api/claims/:id`         | ADMIN, AGENT                         | general correction + the UNDER_REVIEW transition; blocked once CLOSED |
| POST   | `/api/claims/:id/approve` | ADMIN, AGENT                         | requires `approvedAmount`                                             |
| POST   | `/api/claims/:id/reject`  | ADMIN, AGENT                         | requires `remarks` (reason)                                           |
| POST   | `/api/claims/:id/close`   | ADMIN, AGENT                         | only from APPROVED or REJECTED                                        |

CUSTOMER has no `PUT`/approve/reject/close access at all — create and view-only, per spec.

## Search, filters, sorting, pagination

- `search` — matches `claimNumber`, the linked policy's `policyNumber`, or the linked
  customer's `fullName` (all `contains`, case-insensitive) via relation filters.
- `status` / `claimType` — exact match.
- `policyId` — exact match; added as a query filter (not a new route) specifically so the
  frontend's per-policy Claim History page can ask for one policy's claims without a new
  nested endpoint, consistent with the Day 6 spec's literal route list. A CUSTOMER using this
  filter is checked against policy ownership in the service layer before results are returned.
- `dateFrom` / `dateTo` — range filter on `claimDate`.
- `sortBy` — `claimDate` | `incidentDate` | `claimAmount`; `sortOrder` — `asc` | `desc`.
- Same pagination shape as every other module.

## Frontend

| Route                  | Page                                                                                                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/claims`              | List — search, status/type filters, table                                                                                                                   |
| `/claims/new`          | Register Claim — supports `?policyId=` prefill from a policy page                                                                                           |
| `/claims/:id`          | Details — status-appropriate action buttons (Mark Under Review / Approve / Reject / Close), computed from the same `ALLOWED_TRANSITIONS` map as the backend |
| `/claims/:id/edit`     | Edit — blocked server-side once CLOSED                                                                                                                      |
| `/policies/:id/claims` | Claim History — scoped to one policy via the new `policyId` filter, linked from the policy detail page's "Claim History" card                               |

New reusable component: `ClaimDecisionDialog` (`features/claims/`) — a single component with
an `approve`/`reject` mode prop, since both are structurally the same "confirm + provide
detail" interaction, avoiding two near-duplicate modal components (DRY). `StatusBadge` was
extended with color mappings for all five `ClaimStatus` values (green/amber/red/gray) and now
also formats underscores as spaces (`UNDER_REVIEW` → "UNDER REVIEW") for every module that uses
it, not just claims.
