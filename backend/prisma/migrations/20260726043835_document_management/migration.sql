-- CreateEnum
CREATE TYPE "DocumentEntityType" AS ENUM ('CUSTOMER', 'POLICY', 'CLAIM');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ID_PROOF', 'ADDRESS_PROOF', 'POLICY_DOCUMENT', 'CLAIM_DOCUMENT', 'PHOTO', 'OTHER');

-- DropForeignKey — Document moves from a direct Customer FK to a polymorphic
-- (entityType, entityId) pair, since it must also be able to attach to
-- Policy and Claim. (Table is empty in this environment, so this is safe.)
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_customerId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "documents_customerId_idx";

-- AlterTable
ALTER TABLE "documents"
  DROP COLUMN "customerId",
  DROP COLUMN "fileName",
  DROP COLUMN "filePath",
  ADD COLUMN "entityType" "DocumentEntityType" NOT NULL DEFAULT 'CUSTOMER',
  ADD COLUMN "entityId" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "documentType" "DocumentType" NOT NULL DEFAULT 'OTHER',
  ADD COLUMN "originalFileName" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "storedFileName" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "mimeType" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "fileSize" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "storagePath" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "uploadedBy" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Drop the temporary defaults now that future rows must supply real values
-- explicitly at the application layer.
ALTER TABLE "documents" ALTER COLUMN "entityType" DROP DEFAULT;
ALTER TABLE "documents" ALTER COLUMN "entityId" DROP DEFAULT;
ALTER TABLE "documents" ALTER COLUMN "documentType" DROP DEFAULT;
ALTER TABLE "documents" ALTER COLUMN "originalFileName" DROP DEFAULT;
ALTER TABLE "documents" ALTER COLUMN "storedFileName" DROP DEFAULT;
ALTER TABLE "documents" ALTER COLUMN "mimeType" DROP DEFAULT;
ALTER TABLE "documents" ALTER COLUMN "fileSize" DROP DEFAULT;
ALTER TABLE "documents" ALTER COLUMN "storagePath" DROP DEFAULT;
ALTER TABLE "documents" ALTER COLUMN "uploadedBy" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "documents_entityType_entityId_idx" ON "documents"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "documents_documentType_idx" ON "documents"("documentType");

-- CreateIndex
CREATE INDEX "documents_deletedAt_idx" ON "documents"("deletedAt");

-- CreateIndex
CREATE INDEX "documents_uploadedAt_idx" ON "documents"("uploadedAt");

-- AddForeignKey — uploadedBy is a normal (non-polymorphic) reference to a
-- single table, so it gets a real FK for traceability/integrity.
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedBy_fkey"
  FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
