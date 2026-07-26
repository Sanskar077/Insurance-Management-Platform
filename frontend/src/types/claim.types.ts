export type ClaimType = 'LIFE' | 'HEALTH' | 'VEHICLE' | 'HOME' | 'TRAVEL' | 'OTHER';
export type ClaimStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CLOSED';

export interface Claim {
  id: string;
  policyId: string;
  claimNumber: string;
  claimType: ClaimType;
  claimAmount: string;
  approvedAmount: string | null;
  incidentDate: string;
  claimDate: string;
  description: string;
  status: ClaimStatus;
  remarks: string | null;
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

export interface PaginatedClaims {
  data: Claim[];
  meta: PaginationMeta;
}

export interface CreateClaimInput {
  policyId: string;
  claimType: ClaimType;
  claimAmount: number;
  incidentDate: string;
  claimDate?: string;
  description: string;
}

export interface UpdateClaimInput {
  claimType?: ClaimType;
  claimAmount?: number;
  incidentDate?: string;
  description?: string;
  status?: 'UNDER_REVIEW';
}

export interface ApproveClaimInput {
  approvedAmount: number;
  remarks?: string;
}

export interface RejectClaimInput {
  remarks: string;
}

export interface CloseClaimInput {
  remarks?: string;
}

export const CLAIM_TYPES: ClaimType[] = ['LIFE', 'HEALTH', 'VEHICLE', 'HOME', 'TRAVEL', 'OTHER'];
export const CLAIM_STATUSES: ClaimStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'CLOSED',
];

/** Mirrors the backend's ALLOWED_TRANSITIONS in services/claim.service.ts. */
export const ALLOWED_TRANSITIONS: Record<ClaimStatus, ClaimStatus[]> = {
  SUBMITTED: ['UNDER_REVIEW', 'APPROVED', 'REJECTED'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['CLOSED'],
  REJECTED: ['CLOSED'],
  CLOSED: [],
};
