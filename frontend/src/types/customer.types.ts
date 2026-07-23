export type Role = 'ADMIN' | 'AGENT' | 'CUSTOMER';

export interface Customer {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedCustomers {
  data: Customer[];
  meta: PaginationMeta;
}

export interface CreateCustomerInput {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
}

export interface UpdateCustomerInput {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  dob?: string;
}

export interface CreateCustomerResult {
  customer: Customer;
  temporaryPassword: string;
}
