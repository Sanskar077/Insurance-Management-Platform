import type { Prisma } from '@prisma/client';
import { prisma } from '@lib/prisma.js';

/**
 * Lightweight, take-limited lookups for global search. Each query selects
 * only the fields the result list needs and excludes soft-deleted rows.
 * `customerId` (when present) scopes policy/claim/payment hits to one
 * customer — used for the CUSTOMER role.
 */

const insensitive = (search: string): Prisma.StringFilter => ({
  contains: search,
  mode: 'insensitive',
});

export const searchRepository = {
  async searchCustomers(term: string, take: number) {
    return prisma.customer.findMany({
      where: {
        deletedAt: null,
        OR: [
          { fullName: insensitive(term) },
          { email: insensitive(term) },
          { phone: insensitive(term) },
        ],
      },
      select: { id: true, fullName: true, email: true, phone: true },
      orderBy: { fullName: 'asc' },
      take,
    });
  },

  async searchPolicies(term: string, take: number, customerId?: string) {
    return prisma.policy.findMany({
      where: {
        deletedAt: null,
        ...(customerId ? { customerId } : {}),
        OR: [{ policyNumber: insensitive(term) }, { customer: { fullName: insensitive(term) } }],
      },
      select: {
        id: true,
        policyNumber: true,
        policyType: true,
        status: true,
        customer: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
    });
  },

  async searchClaims(term: string, take: number, customerId?: string) {
    return prisma.claim.findMany({
      where: {
        deletedAt: null,
        ...(customerId ? { policy: { customerId } } : {}),
        OR: [{ claimNumber: insensitive(term) }, { policy: { policyNumber: insensitive(term) } }],
      },
      select: {
        id: true,
        claimNumber: true,
        status: true,
        policy: { select: { policyNumber: true } },
      },
      orderBy: { claimDate: 'desc' },
      take,
    });
  },

  async searchPayments(term: string, take: number, customerId?: string) {
    return prisma.premiumPayment.findMany({
      where: {
        ...(customerId ? { policy: { customerId } } : {}),
        OR: [
          { transactionReference: insensitive(term) },
          { policy: { policyNumber: insensitive(term) } },
        ],
      },
      select: {
        id: true,
        transactionReference: true,
        paymentStatus: true,
        amount: true,
        policy: { select: { policyNumber: true } },
      },
      orderBy: { dueDate: 'desc' },
      take,
    });
  },

  async searchDocuments(term: string, take: number) {
    return prisma.document.findMany({
      where: {
        deletedAt: null,
        originalFileName: insensitive(term),
      },
      select: { id: true, originalFileName: true, entityType: true },
      orderBy: { uploadedAt: 'desc' },
      take,
    });
  },
};
