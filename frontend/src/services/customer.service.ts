import { apiRequest } from '@lib/apiClient';
import type {
  Customer,
  CreateCustomerInput,
  CreateCustomerResult,
  PaginatedCustomers,
  UpdateCustomerInput,
} from '@app-types/customer.types';

interface ApiEnvelope<T> {
  success: true;
  data: T;
}

interface ListEnvelope {
  success: true;
  data: Customer[];
  meta: PaginatedCustomers['meta'];
}

export async function listCustomers(params: {
  page: number;
  limit: number;
  search?: string;
  sortBy?: 'fullName' | 'createdAt' | 'dob';
  sortOrder?: 'asc' | 'desc';
}): Promise<PaginatedCustomers> {
  const result = await apiRequest<ListEnvelope>('/customers', {
    method: 'GET',
    query: {
      page: params.page,
      limit: params.limit,
      search: params.search,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    },
  });
  return { data: result.data, meta: result.meta };
}

export async function getCustomerById(id: string): Promise<Customer> {
  const result = await apiRequest<ApiEnvelope<Customer>>(`/customers/${id}`);
  return result.data;
}

export async function getOwnProfile(): Promise<Customer> {
  const result = await apiRequest<ApiEnvelope<Customer>>('/customers/me');
  return result.data;
}

export async function createCustomer(input: CreateCustomerInput): Promise<CreateCustomerResult> {
  const result = await apiRequest<ApiEnvelope<CreateCustomerResult>>('/customers', {
    method: 'POST',
    body: input,
  });
  return result.data;
}

export async function updateCustomer(id: string, input: UpdateCustomerInput): Promise<Customer> {
  const result = await apiRequest<ApiEnvelope<Customer>>(`/customers/${id}`, {
    method: 'PUT',
    body: input,
  });
  return result.data;
}

export async function deleteCustomer(id: string): Promise<void> {
  await apiRequest<{ success: true; message: string }>(`/customers/${id}`, {
    method: 'DELETE',
  });
}
