import type {
  ClaimStatus,
  DocumentEntityType,
  PaymentStatus,
  PolicyStatus,
  PolicyType,
} from '@prisma/client';

/**
 * Global search results — minimal fields per hit, just enough for the
 * result list to render a label and link to the entity's detail page.
 */

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

export interface GlobalSearchResultsDto {
  query: string;
  customers: CustomerSearchHit[];
  policies: PolicySearchHit[];
  claims: ClaimSearchHit[];
  payments: PaymentSearchHit[];
  documents: DocumentSearchHit[];
}
