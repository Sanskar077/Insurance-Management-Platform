export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'FAILED';
export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'OTHER';

export interface PremiumPayment {
  id: string;
  policyId: string;
  amount: string;
  dueDate: string;
  paymentDate: string | null;
  paymentMethod: string | null;
  transactionReference: string | null;
  paymentStatus: PaymentStatus;
  remarks: string | null;
  isOverdue: boolean;
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

export interface PaginatedPayments {
  data: PremiumPayment[];
  meta: PaginationMeta;
}

export interface CreatePaymentInput {
  policyId: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  transactionReference?: string;
  paymentStatus?: PaymentStatus;
  remarks?: string;
}

export interface UpdatePaymentInput {
  amount?: number;
  dueDate?: string;
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  transactionReference?: string;
  paymentStatus?: PaymentStatus;
  remarks?: string;
}

export const PAYMENT_STATUSES: PaymentStatus[] = ['PENDING', 'PAID', 'OVERDUE', 'FAILED'];
export const PAYMENT_METHODS: PaymentMethod[] = [
  'CASH',
  'CARD',
  'BANK_TRANSFER',
  'UPI',
  'CHEQUE',
  'OTHER',
];
