import { z } from 'zod';
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '@constants/pagination.js';

export const USER_ROLES = ['ADMIN', 'AGENT', 'CUSTOMER'] as const;

/** Roles an ADMIN may assign directly. CUSTOMER accounts are always created
 * through customer registration so the User+Customer invariant holds. */
export const STAFF_ROLES = ['ADMIN', 'AGENT'] as const;

export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
  role: z.enum(STAFF_ROLES),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserRoleSchema = z.object({
  role: z.enum(STAFF_ROLES),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

export const userSearchQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  search: z.string().trim().min(1).optional(),
  role: z.enum(USER_ROLES).optional(),
  sortBy: z.enum(['name', 'email', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type UserSearchQuery = z.infer<typeof userSearchQuerySchema>;

export const userIdParamSchema = z.object({
  id: z.uuid('Invalid user id'),
});
