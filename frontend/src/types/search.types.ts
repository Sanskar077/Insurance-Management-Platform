import type { ClaimStatus } from '@app-types/claim.types';
import type { PolicyStatus, PolicyType } from '@app-types/policy.types';
import type { PaymentStatus } from '@app-types/premiumPayment.types';
import type { DocumentEntityType } from '@app-types/document.types';

/** Results of GET /api/search — minimal fields for the result dropdown. */

export interface CustomerSearchHit {
  id: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface PolicySearchHit {
  id: string;
  policyNumber: string;
  policyType: PolicyType;
  status: PolicyStatus;
  customerName: string;
}

export interface ClaimSearchHit {
  id: string;
  claimNumber: string;
  status: ClaimStatus;
  policyNumber: string;
}

export interface PaymentSearchHit {
  id: string;
  transactionReference: string | null;
  paymentStatus: PaymentStatus;
  amount: string;
  policyNumber: string;
}

export interface DocumentSearchHit {
  id: string;
  originalFileName: string;
  entityType: DocumentEntityType;
}

export interface GlobalSearchResults {
  query: string;
  customers: CustomerSearchHit[];
  policies: PolicySearchHit[];
  claims: ClaimSearchHit[];
  payments: PaymentSearchHit[];
  documents: DocumentSearchHit[];
}
