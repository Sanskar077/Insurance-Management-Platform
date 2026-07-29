# Document Management Module

## Storage abstraction

Everything above `StorageService` (the document service, controller, routes) never touches
`fs` directly — it only calls `storageService.save()`, `.read()`, `.delete()`. Today that's
backed by `LocalDiskStorageService`, which writes under `backend/uploads/{customers,
policies,claims}/`. Swapping to S3, Azure Blob, or Cloudinary later means writing one new
class that implements `StorageService` and changing a single line in
`services/storage/index.ts` — no business logic changes required. This was the explicit Day 7
architecture instruction, not an inference.

## Why Document is polymorphic (no direct Prisma relation)

A document can attach to a Customer, a Policy, or a Claim. Prisma (like most ORMs) can't
express a single foreign key that points at three different tables. So `Document` stores
`entityType` (enum) + `entityId` (plain string, no FK constraint) instead of a relation field.
The tradeoff: existence and ownership checks that would normally be "free" via a FK/join are
done explicitly in `document.service.ts` (`resolveOwningCustomerId`) and in the repository's
search (`buildSearchWhere` runs three separate lookups against Customer/Policy/Claim and folds
matching ids into the document query). This was verified end-to-end against a live database —
see the root README's Known Issues section.

`uploadedBy`, by contrast, _is_ a normal relation (every document has exactly one uploader, a
single target table) and gets a real FK with `onDelete: Restrict`, confirmed to correctly block
deleting a user who has uploaded documents.

## Security

- **Never trust client filenames.** The original filename is stored only for display
  (`originalFileName`). The actual file on disk is named `<uuid>.<ext>` (`storedFileName`),
  generated server-side (`utils/fileStorage.ts`), with the extension taken from the
  _validated_ upload, not re-derived from user input at storage time.
- **Path traversal prevention.** `LocalDiskStorageService` rejects any subdirectory or
  filename segment containing `..`, `/`, or `\`, and independently double-checks the final
  resolved absolute path is still inside the uploads root before touching the filesystem —
  verified with actual traversal attempts (`../../etc/passwd`-style inputs) against the real
  filesystem, all correctly rejected.
- **Never expose internal storage paths.** `storagePath` and `storedFileName` are excluded
  from `DocumentDto` — a client only ever sees a document `id` and downloads through
  `GET /documents/:id/download`, which streams bytes through the server; it never learns
  where or how a file is physically stored.
- **File type validation, twice.** Multer's `fileFilter` checks both MIME type and file
  extension against an allowlist (PDF, JPG, JPEG, PNG) — a renamed executable can spoof one
  but not both easily. This is explicitly documented as defense-in-depth, not a virus scan
  (virus scanning is out of scope per the Day 7 spec).
- **Size limit.** Enforced by Multer (`limits.fileSize`, 10 MB), with a dedicated
  `MulterError` handler added to the centralized error middleware so a too-large upload
  returns a clean `400` instead of an unhandled exception.

## Business rules enforced

- Every document's target entity must exist — checked before any storage write happens
  (`resolveOwningCustomerId` throws before `storageService.save()` is ever called, so an
  invalid upload never touches disk).
- Only PDF/JPG/JPEG/PNG accepted, max 10 MB (Multer-level, before the request body is even
  fully read for large files).
- Soft delete only (`deletedAt`) — the underlying file is deliberately left on disk on
  delete; only the DB row becomes unreachable through the API. This mirrors the Customer/
  Policy/Claim soft-delete pattern and keeps deletion recoverable in principle.

## Endpoints

| Method | Path                          | Roles                                | Notes                                                       |
| ------ | ----------------------------- | ------------------------------------ | ----------------------------------------------------------- |
| POST   | `/api/documents`              | ADMIN, AGENT                         | multipart/form-data; CUSTOMER has no upload access per spec |
| GET    | `/api/documents`              | ADMIN, AGENT, CUSTOMER (self-scoped) | search, filters, sort, pagination                           |
| GET    | `/api/documents/:id`          | ADMIN, AGENT, CUSTOMER (self only)   | metadata only                                               |
| GET    | `/api/documents/:id/download` | ADMIN, AGENT, CUSTOMER (self only)   | streams the file                                            |
| DELETE | `/api/documents/:id`          | ADMIN, AGENT                         | soft delete                                                 |

CUSTOMER ownership for POLICY/CLAIM-attached documents resolves transitively: a policy
document is "owned" by the policy's customer; a claim document is owned by the claim's
policy's customer.

## Search, filters, sorting, pagination

- `search` — matches `originalFileName` directly, or resolves against the customer's
  `fullName`, the policy's `policyNumber`, or the claim's `claimNumber` (see "polymorphic"
  section above for why this needs three extra lookups).
- `entityType` / `documentType` — exact match.
- `dateFrom` / `dateTo` — range filter on `uploadedAt`.
- `sortBy` — `uploadedAt` | `fileSize` | `originalFileName`; `sortOrder` — `asc` | `desc`.
- Same pagination shape as every other module.

## Frontend

| Route               | Page                                                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `/documents`        | List — search, entity/type filters, download and delete actions                                                         |
| `/documents/upload` | Upload — client-side file-type/size pre-validation, real upload progress bar, supports `?entityType=&entityId=` prefill |
| `/documents/:id`    | Details — download action, link to the attached entity (staff only)                                                     |

**Upload progress** uses `XMLHttpRequest` rather than `fetch` in `document.service.ts` —
`fetch` has no upload-progress event; `xhr.upload.onprogress` is the standard browser API that
provides real byte-level progress, which the spec explicitly asked for ("provide upload
progress indicator").

New reusable component: `ProgressBar` (`components/ui/`).
