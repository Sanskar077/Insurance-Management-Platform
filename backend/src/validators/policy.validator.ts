import { z } from 'zod';
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '@constants/pagination.js';

export const POLICY_TYPES = ['LIFE', 'HEALTH', 'VEHICLE', 'HOME', 'TRAVEL', 'OTHER'] as const;
export const POLICY_STATUSES = ['ACTIVE', 'EXPIRED', 'CANCELLED', 'RENEWED'] as const;

const moneySchema = z.coerce.number().nonnegative('Must not be negative');

export const createPolicySchema = z
  .object({
    customerId: z.uuid('Invalid customer id'),
    policyType: z.enum(POLICY_TYPES),
    premiumAmount: moneySchema,
    coverageAmount: moneySchema,
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    description: z.string().trim().max(1000).optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'endDate must be after startDate',
    path: ['endDate'],
  });

export type CreatePolicyInput = z.infer<typeof createPolicySchema>;

export const updatePolicySchema = z
  .object({
    policyType: z.enum(POLICY_TYPES).optional(),
    premiumAmount: moneySchema.optional(),
    coverageAmount: moneySchema.optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    description: z.string().trim().max(1000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })
  .refine((data) => !data.startDate || !data.endDate || data.endDate > data.startDate, {
    message: 'endDate must be after startDate',
    path: ['endDate'],
  });

export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>;

export const renewPolicySchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    premiumAmount: moneySchema.optional(),
    coverageAmount: moneySchema.optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'endDate must be after startDate',
    path: ['endDate'],
  });

export type RenewPolicyInput = z.infer<typeof renewPolicySchema>;

export const policySearchQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  search: z.string().trim().min(1).optional(),
  status: z.enum(POLICY_STATUSES).optional(),
  policyType: z.enum(POLICY_TYPES).optional(),
  expired: z.coerce.boolean().optional(),
  sortBy: z.enum(['startDate', 'endDate', 'premiumAmount']).default('startDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PolicySearchQuery = z.infer<typeof policySearchQuerySchema>;

export const policyIdParamSchema = z.object({
  id: z.uuid('Invalid policy id'),
});

export type PolicyIdParam = z.infer<typeof policyIdParamSchema>;
