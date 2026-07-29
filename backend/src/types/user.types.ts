import type { Role, User } from '@prisma/client';

/** Admin-facing user record — never includes the password hash. */
export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** True when a Customer profile is linked (the user is a real customer). */
  hasCustomerProfile: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function toUserDto(user: User & { customer?: { id: string } | null }): UserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    hasCustomerProfile: Boolean(user.customer),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
