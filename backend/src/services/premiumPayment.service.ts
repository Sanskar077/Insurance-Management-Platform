import type { Role } from '@prisma/client';
import { premiumPaymentRepository } from '@repositories/premiumPayment.repository.js';
import { policyRepository } from '@repositories/policy.repository.js';
import { customerRepository } from '@repositories/customer.repository.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '@utils/AppError.js';
import { buildPaginationMeta, type PaginatedResult } from '@app-types/pagination.types.js';
import { toPremiumPaymentDto, type PremiumPaymentDto } from '@app-types/premiumPayment.types.js';
import type {
  CreatePremiumPaymentInput,
  PremiumPaymentSearchQuery,
  UpdatePaymentStatusInput,
  UpdatePremiumPaymentInput,
} from '@validators/premiumPayment.validator.js';

interface RequestingUser {
  userId: string;
  role: Role;
}

async function resolveOwnCustomerId(requester: RequestingUser): Promise<string> {
  const customer = await customerRepository.findByUserId(requester.userId);
  if (!customer) {
    throw new ForbiddenError('No customer profile is linked to this account');
  }
  return customer.id;
}

async function assertCanAccessPayment(
  policyCustomerId: string,
  requester: RequestingUser,
): Promise<void> {
  if (requester.role === 'ADMIN' || requester.role === 'AGENT') return;

  const ownCustomerId = await resolveOwnCustomerId(requester);
  if (ownCustomerId !== policyCustomerId) {
    throw new ForbiddenError('You do not have access to this payment record');
  }
}

export async function createPremiumPayment(
  input: CreatePremiumPaymentInput,
): Promise<PremiumPaymentDto> {
  const policy = await policyRepository.findById(input.policyId);
  if (!policy) {
    throw new BadRequestError('A payment must belong to an existing policy');
  }

  if (policy.status === 'CANCELLED') {
    throw new BadRequestError('Payments cannot be recorded for a cancelled policy');
  }

  if (input.paymentDate && input.paymentDate < policy.startDate) {
    throw new BadRequestError('paymentDate cannot be before the policy start date');
  }

  if (input.transactionReference) {
    const existing = await premiumPaymentRepository.findByTransactionReference(
      input.transactionReference,
    );
    if (existing) {
      throw new ConflictError('A payment with this transaction reference already exists');
    }
  }

  const payment = await premiumPaymentRepository.create({
    amount: input.amount,
    dueDate: input.dueDate,
    paymentDate: input.paymentDate ?? null,
    paymentMethod: input.paymentMethod ?? null,
    transactionReference: input.transactionReference ?? null,
    paymentStatus: input.paymentStatus,
    remarks: input.remarks ?? null,
    policy: { connect: { id: input.policyId } },
  });

  return toPremiumPaymentDto(payment);
}

export async function getPremiumPaymentById(
  id: string,
  requester: RequestingUser,
): Promise<PremiumPaymentDto> {
  const payment = await premiumPaymentRepository.findById(id);
  if (!payment) {
    throw new NotFoundError('Payment record not found');
  }

  const policy = await policyRepository.findById(payment.policyId);
  if (!policy) {
    throw new NotFoundError('Payment record not found');
  }

  await assertCanAccessPayment(policy.customerId, requester);

  return toPremiumPaymentDto(payment);
}

export async function listPremiumPayments(
  query: PremiumPaymentSearchQuery,
  requester: RequestingUser,
): Promise<PaginatedResult<PremiumPaymentDto>> {
  const skip = (query.page - 1) * query.limit;

  const customerId =
    requester.role === 'CUSTOMER' ? await resolveOwnCustomerId(requester) : undefined;

  const { data, totalRecords } = await premiumPaymentRepository.findMany({
    skip,
    take: query.limit,
    search: query.search,
    paymentStatus: query.paymentStatus,
    paymentMethod: query.paymentMethod,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    customerId,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });

  return {
    data: data.map(toPremiumPaymentDto),
    meta: buildPaginationMeta(totalRecords, query.page, query.limit),
  };
}

export async function listPaymentsForPolicy(
  policyId: string,
  page: number,
  limit: number,
  requester: RequestingUser,
): Promise<PaginatedResult<PremiumPaymentDto>> {
  const policy = await policyRepository.findById(policyId);
  if (!policy) {
    throw new NotFoundError('Policy not found');
  }

  await assertCanAccessPayment(policy.customerId, requester);

  const skip = (page - 1) * limit;
  const { data, totalRecords } = await premiumPaymentRepository.findMany({
    skip,
    take: limit,
    policyId,
    sortBy: 'dueDate',
    sortOrder: 'desc',
  });

  return {
    data: data.map(toPremiumPaymentDto),
    meta: buildPaginationMeta(totalRecords, page, limit),
  };
}

export async function listOverduePayments(
  page: number,
  limit: number,
  requester: RequestingUser,
): Promise<PaginatedResult<PremiumPaymentDto>> {
  const skip = (page - 1) * limit;

  const customerId =
    requester.role === 'CUSTOMER' ? await resolveOwnCustomerId(requester) : undefined;

  const { data, totalRecords } = await premiumPaymentRepository.findOverdue(
    skip,
    limit,
    customerId,
  );

  return {
    data: data.map(toPremiumPaymentDto),
    meta: buildPaginationMeta(totalRecords, page, limit),
  };
}

/** ADMIN — full administrative correction of an existing payment record. */
export async function updatePremiumPayment(
  id: string,
  input: UpdatePremiumPaymentInput,
): Promise<PremiumPaymentDto> {
  const existing = await premiumPaymentRepository.findById(id);
  if (!existing) {
    throw new NotFoundError('Payment record not found');
  }

  const updated = await premiumPaymentRepository.update(id, input);
  return toPremiumPaymentDto(updated);
}

/** AGENT — status-only correction, per "update payment status if required". */
export async function updatePaymentStatus(
  id: string,
  input: UpdatePaymentStatusInput,
): Promise<PremiumPaymentDto> {
  const existing = await premiumPaymentRepository.findById(id);
  if (!existing) {
    throw new NotFoundError('Payment record not found');
  }

  const updated = await premiumPaymentRepository.update(id, input);
  return toPremiumPaymentDto(updated);
}
