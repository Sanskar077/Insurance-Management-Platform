import type {
  ClaimStatus,
  ClaimType,
  PaymentStatus,
  PolicyStatus,
  PolicyType,
} from '@prisma/client';
import { Prisma } from '@prisma/client';
import { prisma } from '@lib/prisma.js';

/**
 * Read-only aggregate queries for the Reports Dashboard (Day 8).
 * No report tables exist — every figure is computed live from the
 * existing customers / policies / premium_payments / claims / documents
 * tables. Soft-deleted rows (deletedAt != null) are always excluded.
 */

interface MonthCountRow {
  month: Date;
  count: bigint;
}

interface MonthAmountRow {
  month: Date;
  amount: Prisma.Decimal | null;
}

export const reportRepository = {
  // -------------------------------------------------------------------------
  // Dashboard summary counts
  // -------------------------------------------------------------------------

  async countCustomers(createdSince?: Date): Promise<number> {
    return prisma.customer.count({
      where: {
        deletedAt: null,
        ...(createdSince ? { createdAt: { gte: createdSince } } : {}),
      },
    });
  },

  async countPolicies(status?: PolicyStatus): Promise<number> {
    return prisma.policy.count({
      where: { deletedAt: null, ...(status ? { status } : {}) },
    });
  },

  /** ACTIVE policies whose endDate falls inside [now, until]. */
  async countPoliciesExpiringBetween(now: Date, until: Date): Promise<number> {
    return prisma.policy.count({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        endDate: { gte: now, lte: until },
      },
    });
  },

  async countClaims(statuses?: ClaimStatus[]): Promise<number> {
    return prisma.claim.count({
      where: {
        deletedAt: null,
        ...(statuses ? { status: { in: statuses } } : {}),
      },
    });
  },

  async countDocuments(): Promise<number> {
    return prisma.document.count({ where: { deletedAt: null } });
  },

  /** Sum + count of payments per status, in one grouped query. */
  async paymentTotalsByStatus(): Promise<
    { status: PaymentStatus; count: number; amount: Prisma.Decimal | null }[]
  > {
    const rows = await prisma.premiumPayment.groupBy({
      by: ['paymentStatus'],
      _count: { _all: true },
      _sum: { amount: true },
    });
    return rows.map((row) => ({
      status: row.paymentStatus,
      count: row._count._all,
      amount: row._sum.amount,
    }));
  },

  /** Overdue = still PENDING past dueDate — same live rule as Day 5. */
  async overduePaymentTotals(now: Date): Promise<{ count: number; amount: Prisma.Decimal | null }> {
    const result = await prisma.premiumPayment.aggregate({
      where: { paymentStatus: 'PENDING', dueDate: { lt: now } },
      _count: { _all: true },
      _sum: { amount: true },
    });
    return { count: result._count._all, amount: result._sum.amount };
  },

  async approvedClaimAmountTotal(): Promise<Prisma.Decimal | null> {
    const result = await prisma.claim.aggregate({
      where: { deletedAt: null, status: { in: ['APPROVED', 'CLOSED'] } },
      _sum: { approvedAmount: true },
    });
    return result._sum.approvedAmount;
  },

  async claimedAmountTotal(): Promise<Prisma.Decimal | null> {
    const result = await prisma.claim.aggregate({
      where: { deletedAt: null },
      _sum: { claimAmount: true },
    });
    return result._sum.claimAmount;
  },

  // -------------------------------------------------------------------------
  // Month-bucketed time series (date_trunc lives in the database — the rows
  // returned are already aggregated, never raw records)
  // -------------------------------------------------------------------------

  async customerRegistrationsByMonth(since: Date): Promise<{ month: Date; count: number }[]> {
    const rows = await prisma.$queryRaw<MonthCountRow[]>`
      SELECT date_trunc('month', "createdAt") AS month, COUNT(*) AS count
      FROM "customers"
      WHERE "deletedAt" IS NULL AND "createdAt" >= ${since}
      GROUP BY 1
      ORDER BY 1
    `;
    return rows.map((row) => ({ month: row.month, count: Number(row.count) }));
  },

  /** PAID premium totals bucketed by paymentDate month. */
  async premiumsCollectedByMonth(since: Date): Promise<{ month: Date; amount: number }[]> {
    const rows = await prisma.$queryRaw<MonthAmountRow[]>`
      SELECT date_trunc('month', "paymentDate") AS month, SUM("amount") AS amount
      FROM "premium_payments"
      WHERE "paymentStatus" = 'PAID' AND "paymentDate" IS NOT NULL AND "paymentDate" >= ${since}
      GROUP BY 1
      ORDER BY 1
    `;
    return rows.map((row) => ({ month: row.month, amount: Number(row.amount ?? 0) }));
  },

  /** All premium amounts falling due, bucketed by dueDate month. */
  async premiumsDueByMonth(since: Date): Promise<{ month: Date; amount: number }[]> {
    const rows = await prisma.$queryRaw<MonthAmountRow[]>`
      SELECT date_trunc('month', "dueDate") AS month, SUM("amount") AS amount
      FROM "premium_payments"
      WHERE "dueDate" >= ${since}
      GROUP BY 1
      ORDER BY 1
    `;
    return rows.map((row) => ({ month: row.month, amount: Number(row.amount ?? 0) }));
  },

  async claimSubmissionsByMonth(since: Date): Promise<{ month: Date; count: number }[]> {
    const rows = await prisma.$queryRaw<MonthCountRow[]>`
      SELECT date_trunc('month', "claimDate") AS month, COUNT(*) AS count
      FROM "claims"
      WHERE "deletedAt" IS NULL AND "claimDate" >= ${since}
      GROUP BY 1
      ORDER BY 1
    `;
    return rows.map((row) => ({ month: row.month, count: Number(row.count) }));
  },

  // -------------------------------------------------------------------------
  // Grouped breakdowns
  // -------------------------------------------------------------------------

  async policyCountsByStatus(): Promise<{ status: PolicyStatus; count: number }[]> {
    const rows = await prisma.policy.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { _all: true },
    });
    return rows.map((row) => ({ status: row.status, count: row._count._all }));
  },

  async policyCountsByType(): Promise<{ type: PolicyType; count: number }[]> {
    const rows = await prisma.policy.groupBy({
      by: ['policyType'],
      where: { deletedAt: null },
      _count: { _all: true },
    });
    return rows.map((row) => ({ type: row.policyType, count: row._count._all }));
  },

  async claimCountsByStatus(): Promise<{ status: ClaimStatus; count: number }[]> {
    const rows = await prisma.claim.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { _all: true },
    });
    return rows.map((row) => ({ status: row.status, count: row._count._all }));
  },

  async claimCountsByType(): Promise<{ type: ClaimType; count: number }[]> {
    const rows = await prisma.claim.groupBy({
      by: ['claimType'],
      where: { deletedAt: null },
      _count: { _all: true },
    });
    return rows.map((row) => ({ type: row.claimType, count: row._count._all }));
  },
};
