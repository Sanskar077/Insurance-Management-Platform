-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'FAILED');

-- AlterTable: convert paymentStatus to enum, make paymentDate optional (only
-- known once a payment is actually made), add new premium-tracking columns.
-- (Table is empty in this environment, so casts are safe as written.)
ALTER TABLE "premium_payments"
  ALTER COLUMN "paymentStatus" DROP DEFAULT,
  ALTER COLUMN "paymentStatus" TYPE "PaymentStatus" USING ("paymentStatus"::"PaymentStatus"),
  ALTER COLUMN "paymentStatus" SET DEFAULT 'PENDING',
  ALTER COLUMN "paymentDate" DROP NOT NULL,
  ADD COLUMN "dueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "paymentMethod" TEXT,
  ADD COLUMN "transactionReference" TEXT,
  ADD COLUMN "remarks" TEXT;

-- Drop the temporary default now that future rows must supply a real dueDate
-- explicitly at the application layer.
ALTER TABLE "premium_payments" ALTER COLUMN "dueDate" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "premium_payments_transactionReference_key" ON "premium_payments"("transactionReference");

-- CreateIndex
CREATE INDEX "premium_payments_dueDate_idx" ON "premium_payments"("dueDate");
