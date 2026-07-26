-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ClaimType" AS ENUM ('LIFE', 'HEALTH', 'VEHICLE', 'HOME', 'TRAVEL', 'OTHER');

-- CreateSequence — used to generate readable claim numbers (CLM-YYYY-000001),
-- mirroring the policy_number_seq pattern from Day 4. The UUID primary key
-- remains the internal identifier; this only feeds the display value.
CREATE SEQUENCE IF NOT EXISTS "claim_number_seq" START WITH 1 INCREMENT BY 1;

-- AlterTable: rename reason -> description, submissionDate -> claimDate,
-- convert status to the ClaimStatus enum, and add the new claim-processing
-- columns. (Table is empty in this environment, so casts/renames are safe
-- as written.)
ALTER TABLE "claims" RENAME COLUMN "reason" TO "description";
ALTER TABLE "claims" RENAME COLUMN "submissionDate" TO "claimDate";

ALTER TABLE "claims"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "ClaimStatus" USING ("status"::"ClaimStatus"),
  ALTER COLUMN "status" SET DEFAULT 'SUBMITTED',
  ADD COLUMN "claimNumber" TEXT,
  ADD COLUMN "claimType" "ClaimType" NOT NULL DEFAULT 'OTHER',
  ADD COLUMN "approvedAmount" DECIMAL(12,2),
  ADD COLUMN "incidentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "remarks" TEXT,
  ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Drop the temporary defaults now that future rows must supply real values
-- explicitly at the application layer.
ALTER TABLE "claims" ALTER COLUMN "claimType" DROP DEFAULT;
ALTER TABLE "claims" ALTER COLUMN "incidentDate" DROP DEFAULT;

-- Backfill required, then enforce NOT NULL + UNIQUE on claimNumber. (No
-- existing rows in this environment, so this is a no-op backfill, but kept
-- for correctness if this migration ever runs against a populated table.)
UPDATE "claims" SET "claimNumber" = 'CLM-LEGACY-' || substr(id, 1, 8) WHERE "claimNumber" IS NULL;
ALTER TABLE "claims" ALTER COLUMN "claimNumber" SET NOT NULL;
CREATE UNIQUE INDEX "claims_claimNumber_key" ON "claims"("claimNumber");

-- CreateIndex
CREATE INDEX "claims_claimType_idx" ON "claims"("claimType");

-- CreateIndex
CREATE INDEX "claims_deletedAt_idx" ON "claims"("deletedAt");
