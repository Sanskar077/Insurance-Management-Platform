import { apiRequest } from '@lib/apiClient';
import type {
  CreatePolicyInput,
  PaginatedPolicies,
  Policy,
  PolicyStatus,
  PolicyType,
  RenewPolicyInput,
  UpdatePolicyInput,
} from '@app-types/policy.types';

interface ApiEnvelope<T> {
  success: true;
  data: T;
}

interface ListEnvelope {
  success: true;
  data: Policy[];
  meta: PaginatedPolicies['meta'];
}

export interface ListPoliciesParams {
  page: number;
  limit: number;
  search?: string;
  status?: PolicyStatus;
  policyType?: PolicyType;
  expired?: boolean;
  minPremium?: number;
  maxPremium?: number;
  sortBy?: 'startDate' | 'endDate' | 'premiumAmount';
  sortOrder?: 'asc' | 'desc';
}

export async function listPolicies(params: ListPoliciesParams): Promise<PaginatedPolicies> {
  const result = await apiRequest<ListEnvelope>('/policies', {
    method: 'GET',
    query: {
      page: params.page,
      limit: params.limit,
      search: params.search,
      status: params.status,
      policyType: params.policyType,
      expired: params.expired === undefined ? undefined : String(params.expired),
      minPremium: params.minPremium,
      maxPremium: params.maxPremium,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    },
  });
  return { data: result.data, meta: result.meta };
}

export async function getPolicyById(id: string): Promise<Policy> {
  const result = await apiRequest<ApiEnvelope<Policy>>(`/policies/${id}`);
  return result.data;
}

export async function createPolicy(input: CreatePolicyInput): Promise<Policy> {
  const result = await apiRequest<ApiEnvelope<Policy>>('/policies', {
    method: 'POST',
    body: input,
  });
  return result.data;
}

export async function updatePolicy(id: string, input: UpdatePolicyInput): Promise<Policy> {
  const result = await apiRequest<ApiEnvelope<Policy>>(`/policies/${id}`, {
    method: 'PUT',
    body: input,
  });
  return result.data;
}

export async function cancelPolicy(id: string): Promise<Policy> {
  const result = await apiRequest<ApiEnvelope<Policy>>(`/policies/${id}/cancel`, {
    method: 'POST',
  });
  return result.data;
}

export async function renewPolicy(id: string, input: RenewPolicyInput): Promise<Policy> {
  const result = await apiRequest<ApiEnvelope<Policy>>(`/policies/${id}/renew`, {
    method: 'POST',
    body: input,
  });
  return result.data;
}

export async function deletePolicy(id: string): Promise<void> {
  await apiRequest<{ success: true; message: string }>(`/policies/${id}`, {
    method: 'DELETE',
  });
}
