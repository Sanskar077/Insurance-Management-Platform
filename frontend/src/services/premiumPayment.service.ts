import { apiRequest } from '@lib/apiClient';
import type {
  CreatePaymentInput,
  PaginatedPayments,
  PaymentMethod,
  PaymentStatus,
  PremiumPayment,
  UpdatePaymentInput,
} from '@app-types/premiumPayment.types';

interface ApiEnvelope<T> {
  success: true;
  data: T;
}

interface ListEnvelope {
  success: true;
  data: PremiumPayment[];
  meta: PaginatedPayments['meta'];
}

export interface ListPaymentsParams {
  page: number;
  limit: number;
  search?: string;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'dueDate' | 'paymentDate' | 'amount';
  sortOrder?: 'asc' | 'desc';
}

export async function listPayments(params: ListPaymentsParams): Promise<PaginatedPayments> {
  const result = await apiRequest<ListEnvelope>('/premium-payments', {
    method: 'GET',
    query: {
      page: params.page,
      limit: params.limit,
      search: params.search,
      paymentStatus: params.paymentStatus,
      paymentMethod: params.paymentMethod,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    },
  });
  return { data: result.data, meta: result.meta };
}

export async function listOverduePayments(page: number, limit: number): Promise<PaginatedPayments> {
  const result = await apiRequest<ListEnvelope>('/premium-payments/overdue', {
    method: 'GET',
    query: { page, limit },
  });
  return { data: result.data, meta: result.meta };
}

export async function listPaymentsForPolicy(
  policyId: string,
  page: number,
  limit: number,
): Promise<PaginatedPayments> {
  const result = await apiRequest<ListEnvelope>(`/policies/${policyId}/payments`, {
    method: 'GET',
    query: { page, limit },
  });
  return { data: result.data, meta: result.meta };
}

export async function getPaymentById(id: string): Promise<PremiumPayment> {
  const result = await apiRequest<ApiEnvelope<PremiumPayment>>(`/premium-payments/${id}`);
  return result.data;
}

export async function createPayment(input: CreatePaymentInput): Promise<PremiumPayment> {
  const result = await apiRequest<ApiEnvelope<PremiumPayment>>('/premium-payments', {
    method: 'POST',
    body: input,
  });
  return result.data;
}

export async function updatePayment(
  id: string,
  input: UpdatePaymentInput,
): Promise<PremiumPayment> {
  const result = await apiRequest<ApiEnvelope<PremiumPayment>>(`/premium-payments/${id}`, {
    method: 'PUT',
    body: input,
  });
  return result.data;
}
