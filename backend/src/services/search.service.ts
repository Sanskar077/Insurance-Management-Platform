import type { Role } from '@prisma/client';
import { searchRepository } from '@repositories/search.repository.js';
import { customerRepository } from '@repositories/customer.repository.js';
import { ForbiddenError } from '@utils/AppError.js';
import type { GlobalSearchResultsDto } from '@app-types/search.types.js';

interface RequestingUser {
  userId: string;
  role: Role;
}

/**
 * Global search across all major entities.
 *
 * Scoping mirrors the per-module list endpoints:
 * - ADMIN / AGENT search everything.
 * - CUSTOMER hits are limited to their own policies, claims, and payments;
 *   the customers and documents categories are omitted entirely (customers
 *   would only ever match themselves, and documents carry no per-customer
 *   ownership the CUSTOMER list view exposes globally).
 */
export async function globalSearch(
  query: string,
  limit: number,
  requester: RequestingUser,
): Promise<GlobalSearchResultsDto> {
  const isStaff = requester.role === 'ADMIN' || requester.role === 'AGENT';

  let ownCustomerId: string | undefined;
  if (!isStaff) {
    const customer = await customerRepository.findByUserId(requester.userId);
    if (!customer) {
      throw new ForbiddenError('No customer profile is linked to this account');
    }
    ownCustomerId = customer.id;
  }

  const [customers, policies, claims, payments, documents] = await Promise.all([
    isStaff ? searchRepository.searchCustomers(query, limit) : Promise.resolve([]),
    searchRepository.searchPolicies(query, limit, ownCustomerId),
    searchRepository.searchClaims(query, limit, ownCustomerId),
    searchRepository.searchPayments(query, limit, ownCustomerId),
    isStaff ? searchRepository.searchDocuments(query, limit) : Promise.resolve([]),
  ]);

  return {
    query,
    customers,
    policies: policies.map((policy) => ({
      id: policy.id,
      policyNumber: policy.policyNumber,
      policyType: policy.policyType,
      status: policy.status,
      customerName: policy.customer.fullName,
    })),
    claims: claims.map((claim) => ({
      id: claim.id,
      claimNumber: claim.claimNumber,
      status: claim.status,
      policyNumber: claim.policy.policyNumber,
    })),
    payments: payments.map((payment) => ({
      id: payment.id,
      transactionReference: payment.transactionReference,
      paymentStatus: payment.paymentStatus,
      amount: payment.amount.toString(),
      policyNumber: payment.policy.policyNumber,
    })),
    documents,
  };
}
