import { reportRepository } from '@repositories/report.repository.js';
import type {
  ClaimStatisticsDto,
  CustomerGrowthDto,
  DashboardSummaryDto,
  MonthlyAmountPoint,
  MonthlyCountPoint,
  PolicyStatisticsDto,
  PremiumCollectionDto,
} from '@app-types/report.types.js';

const EXPIRY_WINDOW_DAYS = 30;
const OPEN_CLAIM_STATUSES = ['SUBMITTED', 'UNDER_REVIEW'] as const;

/** First day (00:00 UTC) of the month `monthsBack` months before now. */
function startOfMonthsAgo(monthsBack: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsBack, 1));
}

/** Formats a Date as the "YYYY-MM" bucket key used across all series. */
function toMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/** Ordered list of "YYYY-MM" keys covering the last `months` months (inclusive of the current one). */
function buildMonthKeys(months: number): string[] {
  const keys: string[] = [];
  for (let back = months - 1; back >= 0; back--) {
    keys.push(toMonthKey(startOfMonthsAgo(back)));
  }
  return keys;
}

/**
 * Databases only return buckets that have rows; charts need every month
 * present. Zero-fills the gaps so the series is continuous.
 */
function zeroFillCounts(
  keys: string[],
  rows: { month: Date; count: number }[],
): MonthlyCountPoint[] {
  const byKey = new Map(rows.map((row) => [toMonthKey(row.month), row.count]));
  return keys.map((month) => ({ month, count: byKey.get(month) ?? 0 }));
}

function zeroFillAmounts(
  keys: string[],
  rows: { month: Date; amount: number }[],
): MonthlyAmountPoint[] {
  const byKey = new Map(rows.map((row) => [toMonthKey(row.month), row.amount]));
  return keys.map((month) => ({ month, amount: byKey.get(month) ?? 0 }));
}

export async function getDashboardSummary(): Promise<DashboardSummaryDto> {
  const now = new Date();
  const startOfThisMonth = startOfMonthsAgo(0);
  const expiryLimit = new Date(now.getTime() + EXPIRY_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [
    totalCustomers,
    newCustomersThisMonth,
    totalPolicies,
    activePolicies,
    expiringPolicies,
    paymentTotals,
    overdueTotals,
    totalClaims,
    openClaims,
    approvedClaimAmount,
    totalDocuments,
  ] = await Promise.all([
    reportRepository.countCustomers(),
    reportRepository.countCustomers(startOfThisMonth),
    reportRepository.countPolicies(),
    reportRepository.countPolicies('ACTIVE'),
    reportRepository.countPoliciesExpiringBetween(now, expiryLimit),
    reportRepository.paymentTotalsByStatus(),
    reportRepository.overduePaymentTotals(now),
    reportRepository.countClaims(),
    reportRepository.countClaims([...OPEN_CLAIM_STATUSES]),
    reportRepository.approvedClaimAmountTotal(),
    reportRepository.countDocuments(),
  ]);

  const paid = paymentTotals.find((row) => row.status === 'PAID');
  const pending = paymentTotals.find((row) => row.status === 'PENDING');

  return {
    customers: {
      total: totalCustomers,
      newThisMonth: newCustomersThisMonth,
    },
    policies: {
      total: totalPolicies,
      active: activePolicies,
      expiringInThirtyDays: expiringPolicies,
    },
    premiums: {
      totalCollected: Number(paid?.amount ?? 0),
      pendingAmount: Number(pending?.amount ?? 0),
      overdueCount: overdueTotals.count,
      overdueAmount: Number(overdueTotals.amount ?? 0),
    },
    claims: {
      total: totalClaims,
      open: openClaims,
      approvedAmount: Number(approvedClaimAmount ?? 0),
    },
    documents: {
      total: totalDocuments,
    },
  };
}

export async function getCustomerGrowth(months: number): Promise<CustomerGrowthDto> {
  const since = startOfMonthsAgo(months - 1);
  const rows = await reportRepository.customerRegistrationsByMonth(since);
  return {
    months,
    series: zeroFillCounts(buildMonthKeys(months), rows),
  };
}

export async function getPremiumCollection(months: number): Promise<PremiumCollectionDto> {
  const since = startOfMonthsAgo(months - 1);
  const keys = buildMonthKeys(months);

  const [collectedRows, dueRows] = await Promise.all([
    reportRepository.premiumsCollectedByMonth(since),
    reportRepository.premiumsDueByMonth(since),
  ]);

  return {
    months,
    collected: zeroFillAmounts(keys, collectedRows),
    due: zeroFillAmounts(keys, dueRows),
  };
}

export async function getPolicyStatistics(): Promise<PolicyStatisticsDto> {
  const now = new Date();
  const expiryLimit = new Date(now.getTime() + EXPIRY_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [byStatus, byType, expiring] = await Promise.all([
    reportRepository.policyCountsByStatus(),
    reportRepository.policyCountsByType(),
    reportRepository.countPoliciesExpiringBetween(now, expiryLimit),
  ]);

  return { byStatus, byType, expiringInThirtyDays: expiring };
}

export async function getClaimStatistics(months: number): Promise<ClaimStatisticsDto> {
  const since = startOfMonthsAgo(months - 1);

  const [byStatus, byType, claimedTotal, approvedTotal, monthlyRows] = await Promise.all([
    reportRepository.claimCountsByStatus(),
    reportRepository.claimCountsByType(),
    reportRepository.claimedAmountTotal(),
    reportRepository.approvedClaimAmountTotal(),
    reportRepository.claimSubmissionsByMonth(since),
  ]);

  return {
    byStatus,
    byType,
    totalClaimedAmount: Number(claimedTotal ?? 0),
    totalApprovedAmount: Number(approvedTotal ?? 0),
    monthlySubmissions: zeroFillCounts(buildMonthKeys(months), monthlyRows),
  };
}
