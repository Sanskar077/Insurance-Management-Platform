import type { Claim, ClaimStatus, ClaimType } from '@prisma/client';

export interface ClaimDto {
  id: string;
  policyId: string;
  claimNumber: string;
  claimType: ClaimType;
  claimAmount: string;
  approvedAmount: string | null;
  incidentDate: Date;
  claimDate: Date;
  description: string;
  status: ClaimStatus;
  remarks: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toClaimDto(claim: Claim): ClaimDto {
  return {
    id: claim.id,
    policyId: claim.policyId,
    claimNumber: claim.claimNumber,
    claimType: claim.claimType,
    claimAmount: claim.claimAmount.toString(),
    approvedAmount: claim.approvedAmount?.toString() ?? null,
    incidentDate: claim.incidentDate,
    claimDate: claim.claimDate,
    description: claim.description,
    status: claim.status,
    remarks: claim.remarks,
    createdAt: claim.createdAt,
    updatedAt: claim.updatedAt,
  };
}
