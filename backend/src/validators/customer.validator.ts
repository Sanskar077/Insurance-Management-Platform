import { z } from 'zod';
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '@constants/pagination.js';

const phoneRegex = /^[0-9+\-\s()]{6,20}$/;

export const createCustomerSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  phone: z.string().trim().regex(phoneRegex, 'Invalid phone number'),
  address: z.string().trim().min(3, 'Address must be at least 3 characters'),
  dob: z.coerce.date({ message: 'Invalid date of birth' }),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

/** Full update — available to ADMIN and AGENT. */
export const updateCustomerSchema = z
  .object({
    fullName: z.string().trim().min(2).optional(),
    email: z.string().trim().toLowerCase().email().optional(),
    phone: z.string().trim().regex(phoneRegex, 'Invalid phone number').optional(),
    address: z.string().trim().min(3).optional(),
    dob: z.coerce.date().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

/** Restricted update — available to a CUSTOMER updating their own profile. */
export const updateOwnCustomerSchema = z
  .object({
    phone: z.string().trim().regex(phoneRegex, 'Invalid phone number').optional(),
    address: z.string().trim().min(3).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdateOwnCustomerInput = z.infer<typeof updateOwnCustomerSchema>;

export const customerSearchQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  search: z.string().trim().min(1).optional(),
  sortBy: z.enum(['fullName', 'createdAt', 'dob']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CustomerSearchQuery = z.infer<typeof customerSearchQuerySchema>;

export const customerIdParamSchema = z.object({
  id: z.uuid('Invalid customer id'),
});

export type CustomerIdParam = z.infer<typeof customerIdParamSchema>;
