import type { Policy, PolicyStatus, PolicyType } from '@prisma/client';

export interface PolicyDto {
  id: string;
  customerId: string;
  policyNumber: string;
  policyType: PolicyType;
  premiumAmount: string;
  coverageAmount: string;
  startDate: Date;
  endDate: Date;
  status: PolicyStatus;
  description: string | null;
  isExpired: boolean;
  renewedFromId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toPolicyDto(policy: Policy): PolicyDto {
  return {
    id: policy.id,
    customerId: policy.customerId,
    policyNumber: policy.policyNumber,
    policyType: policy.policyType,
    premiumAmount: policy.premiumAmount.toString(),
    coverageAmount: policy.coverageAmount.toString(),
    startDate: policy.startDate,
    endDate: policy.endDate,
    status: policy.status,
    description: policy.description,
    isExpired: policy.endDate.getTime() < Date.now(),
    renewedFromId: policy.renewedFromId,
    createdAt: policy.createdAt,
    updatedAt: policy.updatedAt,
  };
}
