import { apiRequest } from '@lib/apiClient';
import type { PaginationMeta, Role } from '@app-types/customer.types';
import type { UserAccount } from '@app-types/user.types';

interface ApiEnvelope<T> {
  success: true;
  data: T;
}

interface ListEnvelope {
  success: true;
  data: UserAccount[];
  meta: PaginationMeta;
}

export interface ListUsersParams {
  page: number;
  limit: number;
  search?: string;
  role?: Role;
  sortBy?: 'name' | 'email' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'AGENT';
}

export async function listUsers(
  params: ListUsersParams,
): Promise<{ data: UserAccount[]; meta: PaginationMeta }> {
  const result = await apiRequest<ListEnvelope>('/users', {
    method: 'GET',
    query: {
      page: params.page,
      limit: params.limit,
      search: params.search,
      role: params.role,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    },
  });
  return { data: result.data, meta: result.meta };
}

export async function createUser(input: CreateUserInput): Promise<UserAccount> {
  const result = await apiRequest<ApiEnvelope<UserAccount>>('/users', {
    method: 'POST',
    body: input,
  });
  return result.data;
}

export async function updateUserRole(id: string, role: 'ADMIN' | 'AGENT'): Promise<UserAccount> {
  const result = await apiRequest<ApiEnvelope<UserAccount>>(`/users/${id}/role`, {
    method: 'PUT',
    body: { role },
  });
  return result.data;
}
