export type PolicyType = 'LIFE' | 'HEALTH' | 'VEHICLE' | 'HOME' | 'TRAVEL' | 'OTHER';
export type PolicyStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'RENEWED';

export interface Policy {
  id: string;
  customerId: string;
  policyNumber: string;
  policyType: PolicyType;
  premiumAmount: string;
  coverageAmount: string;
  startDate: string;
  endDate: string;
  status: PolicyStatus;
  description: string | null;
  isExpired: boolean;
  renewedFromId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedPolicies {
  data: Policy[];
  meta: PaginationMeta;
}

export interface CreatePolicyInput {
  customerId: string;
  policyType: PolicyType;
  premiumAmount: number;
  coverageAmount: number;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface UpdatePolicyInput {
  policyType?: PolicyType;
  premiumAmount?: number;
  coverageAmount?: number;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface RenewPolicyInput {
  startDate: string;
  endDate: string;
  premiumAmount?: number;
  coverageAmount?: number;
}

export const POLICY_TYPES: PolicyType[] = ['LIFE', 'HEALTH', 'VEHICLE', 'HOME', 'TRAVEL', 'OTHER'];

export const POLICY_STATUSES: PolicyStatus[] = ['ACTIVE', 'EXPIRED', 'CANCELLED', 'RENEWED'];
