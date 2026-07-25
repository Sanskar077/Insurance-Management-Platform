import { z } from 'zod';
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '@constants/pagination.js';

export const PAYMENT_STATUSES = ['PENDING', 'PAID', 'OVERDUE', 'FAILED'] as const;

// Not a DB enum per the Day 5 spec (only PaymentStatus was required as a
// Prisma enum) — validated at the application layer instead.
export const PAYMENT_METHODS = ['CASH', 'CARD', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'OTHER'] as const;

export const createPremiumPaymentSchema = z
  .object({
    policyId: z.uuid('Invalid policy id'),
    amount: z.coerce.number().positive('Amount must be greater than zero'),
    dueDate: z.coerce.date(),
    paymentDate: z.coerce.date().optional(),
    paymentMethod: z.enum(PAYMENT_METHODS).optional(),
    transactionReference: z.string().trim().min(3).max(100).optional(),
    paymentStatus: z.enum(PAYMENT_STATUSES).default('PENDING'),
    remarks: z.string().trim().max(500).optional(),
  })
  .refine((data) => data.paymentStatus !== 'PAID' || data.paymentDate !== undefined, {
    message: 'paymentDate is required when paymentStatus is PAID',
    path: ['paymentDate'],
  });

export type CreatePremiumPaymentInput = z.infer<typeof createPremiumPaymentSchema>;

/** Full correction — ADMIN only. Payments are otherwise immutable history. */
export const updatePremiumPaymentSchema = z
  .object({
    amount: z.coerce.number().positive('Amount must be greater than zero').optional(),
    dueDate: z.coerce.date().optional(),
    paymentDate: z.coerce.date().optional(),
    paymentMethod: z.enum(PAYMENT_METHODS).optional(),
    transactionReference: z.string().trim().min(3).max(100).optional(),
    paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
    remarks: z.string().trim().max(500).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdatePremiumPaymentInput = z.infer<typeof updatePremiumPaymentSchema>;

/** Status-only correction — AGENT ("update payment status if required"). */
export const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(PAYMENT_STATUSES),
  paymentDate: z.coerce.date().optional(),
  transactionReference: z.string().trim().min(3).max(100).optional(),
});

export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;

export const premiumPaymentSearchQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  search: z.string().trim().min(1).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sortBy: z.enum(['dueDate', 'paymentDate', 'amount']).default('dueDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PremiumPaymentSearchQuery = z.infer<typeof premiumPaymentSearchQuerySchema>;

export const premiumPaymentIdParamSchema = z.object({
  id: z.uuid('Invalid payment id'),
});

export const policyIdParamSchema = z.object({
  policyId: z.uuid('Invalid policy id'),
});
