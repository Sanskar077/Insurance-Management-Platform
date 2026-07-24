-- CreateEnum
CREATE TYPE "PolicyStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'RENEWED');

-- CreateEnum
CREATE TYPE "PolicyType" AS ENUM ('LIFE', 'HEALTH', 'VEHICLE', 'HOME', 'TRAVEL', 'OTHER');

-- CreateSequence — used to generate readable policy numbers (POL-YYYY-000001).
-- The UUID primary key remains the internal identifier; this sequence only
-- feeds the human-readable policyNumber value.
CREATE SEQUENCE IF NOT EXISTS "policy_number_seq" START WITH 1 INCREMENT BY 1;

-- AlterTable: convert existing text columns to enums, add new columns.
-- (No existing rows in this environment, so casts are safe as written; the
-- USING clauses make this safe to re-run against a populated table too.)
ALTER TABLE "policies"
  ALTER COLUMN "policyType" DROP DEFAULT,
  ALTER COLUMN "policyType" TYPE "PolicyType" USING ("policyType"::"PolicyType"),
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "PolicyStatus" USING ("status"::"PolicyStatus"),
  ALTER COLUMN "status" SET DEFAULT 'ACTIVE',
  ADD COLUMN "coverageAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "description" TEXT,
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "renewedFromId" TEXT;

-- Drop the temporary default now that existing/future rows must supply a
-- real coverageAmount explicitly at the application layer.
ALTER TABLE "policies" ALTER COLUMN "coverageAmount" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "policies_policyType_idx" ON "policies"("policyType");

-- CreateIndex
CREATE INDEX "policies_deletedAt_idx" ON "policies"("deletedAt");

-- CreateIndex
CREATE INDEX "policies_endDate_idx" ON "policies"("endDate");

-- AddForeignKey — self-relation for renewal lineage.
ALTER TABLE "policies" ADD CONSTRAINT "policies_renewedFromId_fkey"
  FOREIGN KEY ("renewedFromId") REFERENCES "policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
