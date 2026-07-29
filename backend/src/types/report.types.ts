import type {
  ClaimStatus,
  ClaimType,
  PaymentStatus,
  PolicyStatus,
  PolicyType,
} from '@prisma/client';

/**
 * Report DTOs are read-only aggregates computed live from existing tables —
 * no report data is ever persisted (Day 8 rule: no new tables). Monetary
 * values are plain numbers (not the string form used by entity DTOs) because
 * they are chart/KPI inputs, not editable records.
 */

export interface DashboardSummaryDto {
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

/** One point of a month-bucketed time series. `month` is "YYYY-MM". */
export interface MonthlyCountPoint {
  month: string;
  count: number;
}

export interface MonthlyAmountPoint {
  month: string;
  amount: number;
}

export interface CustomerGrowthDto {
  months: number;
  series: MonthlyCountPoint[];
}

export interface PremiumCollectionDto {
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

export interface PolicyStatisticsDto {
  byStatus: StatusCount<PolicyStatus>[];
  byType: TypeCount<PolicyType>[];
  expiringInThirtyDays: number;
}

export interface ClaimStatisticsDto {
  byStatus: StatusCount<ClaimStatus>[];
  byType: TypeCount<ClaimType>[];
  totalClaimedAmount: number;
  totalApprovedAmount: number;
  monthlySubmissions: MonthlyCountPoint[];
}

export interface PaymentStatusBreakdown {
  status: PaymentStatus;
  count: number;
  amount: number;
}
