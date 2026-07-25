import type { PremiumPayment, PaymentStatus } from '@prisma/client';

export interface PremiumPaymentDto {
  id: string;
  policyId: string;
  amount: string;
  dueDate: Date;
  paymentDate: Date | null;
  paymentMethod: string | null;
  transactionReference: string | null;
  paymentStatus: PaymentStatus;
  remarks: string | null;
  /** Computed at read time — never stored. See docs/premium-tracking.md. */
  isOverdue: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function toPremiumPaymentDto(payment: PremiumPayment): PremiumPaymentDto {
  return {
    id: payment.id,
    policyId: payment.policyId,
    amount: payment.amount.toString(),
    dueDate: payment.dueDate,
    paymentDate: payment.paymentDate,
    paymentMethod: payment.paymentMethod,
    transactionReference: payment.transactionReference,
    paymentStatus: payment.paymentStatus,
    remarks: payment.remarks,
    isOverdue: payment.paymentStatus === 'PENDING' && payment.dueDate.getTime() < Date.now(),
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}
