# Authentication Module

## Endpoints

| Method | Path                 | Auth required | Description                                                         |
| ------ | -------------------- | ------------- | ------------------------------------------------------------------- |
| POST   | `/api/auth/register` | No            | Create a User (and a linked Customer profile if `role: "CUSTOMER"`) |
| POST   | `/api/auth/login`    | No            | Validate credentials, return a JWT                                  |

## Registration flow

1. Request body validated with Zod (`registerSchema`). `role` must be `ADMIN`, `AGENT`, or
   `CUSTOMER`. If `role` is `CUSTOMER`, `fullName`, `dob`, `phone`, and `address` are required.
2. Email uniqueness checked against `User.email` — duplicate emails return `409 Conflict`.
3. Password hashed with bcrypt (cost factor 12) — the plain password is never stored or logged.
4. `User` created; if `role === CUSTOMER`, a linked `Customer` row is created in the same
   database transaction (`prisma.$transaction`), so a User can never exist without its
   Customer profile, or vice versa.
5. A JWT is signed (`{ userId, role }` payload) and returned alongside the public user fields
   (`id`, `name`, `email`, `role` — password is never included in any response).

## Login flow

1. Request body validated with Zod (`loginSchema`).
2. User looked up by email. If not found, or if the password doesn't match, the same generic
   `401 "Invalid email or password"` is returned — the API deliberately does not reveal whether
   the email exists, to avoid user enumeration.
3. Password compared with bcrypt.
4. JWT signed and returned, same shape as registration.

## Authorization middleware

- `authenticate` — reads the `Authorization: Bearer <token>` header, verifies the JWT, and
  attaches `{ userId, role }` to `req.user`. Missing/invalid/expired tokens return `401`.
- `authorize(...roles)` — reusable role-gate; place after `authenticate` on any route. Returns
  `403` if the authenticated user's role isn't in the allowed list. Business-level permission
  rules (e.g. "an Agent can only edit their own customers") are out of scope for Day 2 and will
  be added alongside the relevant CRUD modules.

Example (for future routes, not used yet since no protected routes exist this session):

```ts
router.get("/admin-only", authenticate, authorize("ADMIN"), handler);
```

## Error handling

All errors funnel through a single Express error-handling middleware (`errorHandler`):

- `ZodError` → `400` with a field-level error list
- `AppError` subclasses (`BadRequestError`, `UnauthorizedError`, `ForbiddenError`,
  `NotFoundError`, `ConflictError`) → their respective status code and message
- Anything else (unexpected/programming errors) → `500`, generic message, full error logged
  server-side only. In development, a `debug` field with the error message is included in the
  response; this is stripped in production.

## Security choices

- **bcrypt cost factor 12** — standard balance of security vs. hashing latency.
- **JWT** — stateless, no session store needed; `JWT_EXPIRES_IN` defaults to `1d`.
- **No password ever returned** — the Prisma `select` in every user-facing query/response
  explicitly picks fields, never spreads the raw row.
- **Generic auth error messages** — login failures don't distinguish "no such user" from
  "wrong password".
- **Helmet + CORS** — configured in `app.ts`, origin restricted to `CLIENT_ORIGIN`.
- **No secrets in code** — `JWT_SECRET` and `DATABASE_URL` are read from environment variables
  only (`src/config/env.ts` throws at startup if either is missing).
