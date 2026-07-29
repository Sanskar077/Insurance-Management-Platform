import type { ClaimStatus, ClaimType } from '@app-types/claim.types';
import type { PolicyStatus, PolicyType } from '@app-types/policy.types';

/** Read-only aggregates from GET /api/reports/* — computed live, never stored. */

export interface DashboardSummary {
  customers: {
    total: number;
    newThisMonth: number;
  };
  policies: {
    total: number;
    active: number;
    expiringInThirtyDays: number;
  };
  premiums: {
    totalCollected: number;
    pendingAmount: number;
    overdueCount: number;
    overdueAmount: number;
  };
  claims: {
    total: number;
    open: number;
    approvedAmount: number;
  };
  documents: {
    total: number;
  };
}

/** `month` is a "YYYY-MM" bucket key. */
export interface MonthlyCountPoint {
  month: string;
  count: number;
}

export interface MonthlyAmountPoint {
  month: string;
  amount: number;
}

export interface CustomerGrowthReport {
  months: number;
  series: MonthlyCountPoint[];
}

export interface PremiumCollectionReport {
  months: number;
  collected: MonthlyAmountPoint[];
  due: MonthlyAmountPoint[];
}

export interface StatusCount<TStatus extends string> {
  status: TStatus;
  count: number;
}

export interface TypeCount<TType extends string> {
  type: TType;
  count: number;
}

export interface PolicyStatisticsReport {
  byStatus: StatusCount<PolicyStatus>[];
  byType: TypeCount<PolicyType>[];
  expiringInThirtyDays: number;
}

export interface ClaimStatisticsReport {
  byStatus: StatusCount<ClaimStatus>[];
  byType: TypeCount<ClaimType>[];
  totalClaimedAmount: number;
  totalApprovedAmount: number;
  monthlySubmissions: MonthlyCountPoint[];
}
