# Customer Management Module

## Design assumption — please confirm

The database requires every `Customer` to have a linked `User` (1:1, `userId` unique FK), but
the Day 3 spec's "Create Customer" validation list (`Name`, `Phone`, `Email`, `Address`, `DOB`)
doesn't mention a password. Rather than modify authentication or duplicate the User+Customer
transaction logic, **`POST /customers` reuses the exact same transaction Day 2's registration
flow uses** (extracted into a shared `createUserWithCustomerProfile` helper), and generates a
random temporary password server-side. That password is returned exactly once in the create
response so the Admin/Agent can share it with the customer.

If a different flow is preferred (e.g. an invite-link/email-based activation instead of a
returned temp password), that's a small change confined to `customer.service.ts` — flagging
this now rather than assuming it's final.

## Endpoints

| Method | Path                         | Roles                                                               | Description                                                               |
| ------ | ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| POST   | `/api/customers`             | ADMIN, AGENT                                                        | Create a customer (+ linked User account)                                 |
| GET    | `/api/customers`             | ADMIN, AGENT                                                        | Paginated, searchable list                                                |
| GET    | `/api/customers/me`          | CUSTOMER                                                            | Own profile, no id needed                                                 |
| GET    | `/api/customers/:id`         | ADMIN, AGENT, CUSTOMER (self only)                                  | Single customer                                                           |
| GET    | `/api/customers/:id/history` | ADMIN, AGENT, CUSTOMER (self only)                                  | Placeholder — returns `{ customerId, events: [] }`, no business logic yet |
| PUT    | `/api/customers/:id`         | ADMIN, AGENT (all fields), CUSTOMER (phone/address only, self only) | Update                                                                    |
| DELETE | `/api/customers/:id`         | ADMIN only                                                          | Soft delete (`deletedAt`)                                                 |

## Access control

Enforced in two layers:

1. **Route-level** (`authorize(...roles)`) — coarse role gate, e.g. only ADMIN can hit `DELETE`.
2. **Service-level** (`assertCanAccessCustomer`) — for CUSTOMER-accessible routes, confirms the
   authenticated user's `userId` matches the target customer's `userId` before any read/write.
   A CUSTOMER requesting another customer's `id` gets `403 Forbidden`, not data.

For `PUT`, the request body schema itself differs by role (`validateBodyByRole` middleware):
ADMIN/AGENT can submit `fullName`/`email`/`phone`/`address`/`dob`; CUSTOMER can only submit
`phone`/`address` — extra fields from a CUSTOMER are rejected by the schema, not silently
dropped, so there's no ambiguity about what changed.

## Soft delete

`DELETE` never removes a row. It sets `deletedAt = now()`. Every read path (`findById`,
`findByEmail`, `findByUserId`, `findMany`) filters `deletedAt: null` by default, so deleted
customers disappear from all normal queries while remaining in the database. Verified
end-to-end against a live PostgreSQL instance (see root README's "Known Issues" section).

## Search & pagination

- `GET /api/customers?search=<term>&page=<n>&limit=<n>`
- `search` matches `fullName`, `email`, or `phone` (case-insensitive `contains`), combined with
  `OR`.
- `page` defaults to 1, `limit` defaults to 10 (max 100, enforced by the validator).
- Response shape: `{ success, data: Customer[], meta: { currentPage, totalPages, totalRecords,
hasNext, hasPrevious } }`.

## Frontend

| Route                 | Page       | Notes                                                                                   |
| --------------------- | ---------- | --------------------------------------------------------------------------------------- |
| `/customers`          | List       | Search bar, paginated table, avatar-initials per row, role-aware create/delete buttons  |
| `/customers/new`      | Create     | ADMIN/AGENT only (route itself isn't guarded yet — see note below)                      |
| `/customers/:id`      | Detail     | Read view + history placeholder card                                                    |
| `/customers/:id/edit` | Edit       | Same form component as Create; CUSTOMER role sees only phone/address fields as editable |
| `/customers/me`       | My Profile | CUSTOMER self-view                                                                      |

**Note on route guarding**: since a full Login page is out of scope for Day 3 (see the app
shell's dev-only "paste a JWT" input), client-side route guards by role aren't wired in yet —
the API enforces authorization regardless, so this is a UX nicety to add once Login exists, not
a security gap.

All pages use the shared UI kit (`components/ui/`): `Button`, `Input`, `Spinner`, `EmptyState`,
`ErrorState`, `Pagination`, `SearchBar`, `ConfirmDialog`, `Avatar`, and a toast notification
system (`ToastProvider`) for success/error feedback.
