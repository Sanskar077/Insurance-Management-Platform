import { apiRequest } from '@lib/apiClient';
import type {
  ApproveClaimInput,
  Claim,
  ClaimStatus,
  ClaimType,
  CloseClaimInput,
  CreateClaimInput,
  PaginatedClaims,
  RejectClaimInput,
  UpdateClaimInput,
} from '@app-types/claim.types';

interface ApiEnvelope<T> {
  success: true;
  data: T;
}

interface ListEnvelope {
  success: true;
  data: Claim[];
  meta: PaginatedClaims['meta'];
}

export interface ListClaimsParams {
  page: number;
  limit: number;
  search?: string;
  status?: ClaimStatus;
  claimType?: ClaimType;
  policyId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'claimDate' | 'incidentDate' | 'claimAmount';
  sortOrder?: 'asc' | 'desc';
}

export async function listClaims(params: ListClaimsParams): Promise<PaginatedClaims> {
  const result = await apiRequest<ListEnvelope>('/claims', {
    method: 'GET',
    query: {
      page: params.page,
      limit: params.limit,
      search: params.search,
      status: params.status,
      claimType: params.claimType,
      policyId: params.policyId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    },
  });
  return { data: result.data, meta: result.meta };
}

export async function getClaimById(id: string): Promise<Claim> {
  const result = await apiRequest<ApiEnvelope<Claim>>(`/claims/${id}`);
  return result.data;
}

export async function createClaim(input: CreateClaimInput): Promise<Claim> {
  const result = await apiRequest<ApiEnvelope<Claim>>('/claims', {
    method: 'POST',
    body: input,
  });
  return result.data;
}

export async function updateClaim(id: string, input: UpdateClaimInput): Promise<Claim> {
  const result = await apiRequest<ApiEnvelope<Claim>>(`/claims/${id}`, {
    method: 'PUT',
    body: input,
  });
  return result.data;
}

export async function approveClaim(id: string, input: ApproveClaimInput): Promise<Claim> {
  const result = await apiRequest<ApiEnvelope<Claim>>(`/claims/${id}/approve`, {
    method: 'POST',
    body: input,
  });
  return result.data;
}

export async function rejectClaim(id: string, input: RejectClaimInput): Promise<Claim> {
  const result = await apiRequest<ApiEnvelope<Claim>>(`/claims/${id}/reject`, {
    method: 'POST',
    body: input,
  });
  return result.data;
}

export async function closeClaim(id: string, input: CloseClaimInput): Promise<Claim> {
  const result = await apiRequest<ApiEnvelope<Claim>>(`/claims/${id}/close`, {
    method: 'POST',
    body: input,
  });
  return result.data;
}
