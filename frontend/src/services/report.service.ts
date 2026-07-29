import { apiRequest } from '@lib/apiClient';
import type {
  ClaimStatisticsReport,
  CustomerGrowthReport,
  DashboardSummary,
  PolicyStatisticsReport,
  PremiumCollectionReport,
} from '@app-types/report.types';

interface ApiEnvelope<T> {
  success: true;
  data: T;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const result = await apiRequest<ApiEnvelope<DashboardSummary>>('/reports/summary');
  return result.data;
}

export async function getCustomerGrowth(months?: number): Promise<CustomerGrowthReport> {
  const result = await apiRequest<ApiEnvelope<CustomerGrowthReport>>('/reports/customer-growth', {
    query: { months },
  });
  return result.data;
}

export async function getPremiumCollection(months?: number): Promise<PremiumCollectionReport> {
  const result = await apiRequest<ApiEnvelope<PremiumCollectionReport>>(
    '/reports/premium-collection',
    { query: { months } },
  );
  return result.data;
}

export async function getPolicyStatistics(): Promise<PolicyStatisticsReport> {
  const result = await apiRequest<ApiEnvelope<PolicyStatisticsReport>>(
    '/reports/policy-statistics',
  );
  return result.data;
}

export async function getClaimStatistics(months?: number): Promise<ClaimStatisticsReport> {
  const result = await apiRequest<ApiEnvelope<ClaimStatisticsReport>>('/reports/claim-statistics', {
    query: { months },
  });
  return result.data;
}
