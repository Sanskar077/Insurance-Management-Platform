import { z } from 'zod';
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '@constants/pagination.js';

export const CLAIM_TYPES = ['LIFE', 'HEALTH', 'VEHICLE', 'HOME', 'TRAVEL', 'OTHER'] as const;
export const CLAIM_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'CLOSED',
] as const;

export const createClaimSchema = z
  .object({
    policyId: z.uuid('Invalid policy id'),
    claimType: z.enum(CLAIM_TYPES),
    claimAmount: z.coerce.number().positive('Claim amount must be greater than zero'),
    incidentDate: z.coerce.date(),
    claimDate: z.coerce.date().optional(),
    description: z.string().trim().min(10, 'Description must be at least 10 characters').max(2000),
  })
  .refine((data) => !data.claimDate || data.incidentDate <= data.claimDate, {
    message: 'incidentDate cannot be after claimDate',
    path: ['incidentDate'],
  });

export type CreateClaimInput = z.infer<typeof createClaimSchema>;

/**
 * General correction — ADMIN, AGENT (blocked entirely once CLOSED, checked
 * in the service). Also the sole path for manually marking a claim
 * UNDER_REVIEW — there's no standalone endpoint for that transition in the
 * Day 6 REST API spec, so it's folded into this general update.
 */
export const updateClaimSchema = z
  .object({
    claimType: z.enum(CLAIM_TYPES).optional(),
    claimAmount: z.coerce.number().positive('Claim amount must be greater than zero').optional(),
    incidentDate: z.coerce.date().optional(),
    description: z.string().trim().min(10).max(2000).optional(),
    status: z.literal('UNDER_REVIEW').optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdateClaimInput = z.infer<typeof updateClaimSchema>;

export const approveClaimSchema = z.object({
  approvedAmount: z.coerce.number().positive('Approved amount must be greater than zero'),
  remarks: z.string().trim().max(1000).optional(),
});

export type ApproveClaimInput = z.infer<typeof approveClaimSchema>;

export const rejectClaimSchema = z.object({
  remarks: z.string().trim().min(3, 'A reason for rejection is required').max(1000),
});

export type RejectClaimInput = z.infer<typeof rejectClaimSchema>;

export const closeClaimSchema = z.object({
  remarks: z.string().trim().max(1000).optional(),
});

export type CloseClaimInput = z.infer<typeof closeClaimSchema>;

export const claimSearchQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  search: z.string().trim().min(1).optional(),
  status: z.enum(CLAIM_STATUSES).optional(),
  claimType: z.enum(CLAIM_TYPES).optional(),
  policyId: z.uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  minAmount: z.coerce.number().nonnegative().optional(),
  maxAmount: z.coerce.number().nonnegative().optional(),
  sortBy: z.enum(['claimDate', 'incidentDate', 'claimAmount']).default('claimDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ClaimSearchQuery = z.infer<typeof claimSearchQuerySchema>;

export const claimIdParamSchema = z.object({
  id: z.uuid('Invalid claim id'),
});
