import type { Role } from '@app-types/customer.types';

/** Admin-facing user record from /api/users — no password data ever. */
export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: Role;
  hasCustomerProfile: boolean;
  createdAt: string;
  updatedAt: string;
}

export const USER_ROLES: Role[] = ['ADMIN', 'AGENT', 'CUSTOMER'];
export const STAFF_ROLES: Role[] = ['ADMIN', 'AGENT'];
