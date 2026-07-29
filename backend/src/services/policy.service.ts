import type { Role } from '@prisma/client';
import { policyRepository } from '@repositories/policy.repository.js';
import { customerRepository } from '@repositories/customer.repository.js';
import { generatePolicyNumber } from '@utils/policyNumber.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '@utils/AppError.js';
import { buildPaginationMeta, type PaginatedResult } from '@app-types/pagination.types.js';
import { toPolicyDto, type PolicyDto } from '@app-types/policy.types.js';
import type {
  CreatePolicyInput,
  PolicySearchQuery,
  RenewPolicyInput,
  UpdatePolicyInput,
} from '@validators/policy.validator.js';

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

async function assertCanAccessPolicy(customerId: string, requester: RequestingUser): Promise<void> {
  if (requester.role === 'ADMIN' || requester.role === 'AGENT') return;

  const ownCustomerId = await resolveOwnCustomerId(requester);
  if (ownCustomerId !== customerId) {
    throw new ForbiddenError('You do not have access to this policy');
  }
}

export async function createPolicy(input: CreatePolicyInput): Promise<PolicyDto> {
  const customer = await customerRepository.findById(input.customerId);
  if (!customer) {
    throw new BadRequestError('A policy must belong to an existing customer');
  }

  const policyNumber = await generatePolicyNumber();

  const policy = await policyRepository.create({
    policyNumber,
    policyType: input.policyType,
    premiumAmount: input.premiumAmount,
    coverageAmount: input.coverageAmount,
    startDate: input.startDate,
    endDate: input.endDate,
    description: input.description ?? null,
    status: 'ACTIVE',
    customer: { connect: { id: input.customerId } },
  });

  return toPolicyDto(policy);
}

export async function getPolicyById(id: string, requester: RequestingUser): Promise<PolicyDto> {
  const policy = await policyRepository.findById(id);
  if (!policy) {
    throw new NotFoundError('Policy not found');
  }

  await assertCanAccessPolicy(policy.customerId, requester);

  return toPolicyDto(policy);
}

export async function listPolicies(
  query: PolicySearchQuery,
  requester: RequestingUser,
): Promise<PaginatedResult<PolicyDto>> {
  const skip = (query.page - 1) * query.limit;

  const customerId =
    requester.role === 'CUSTOMER' ? await resolveOwnCustomerId(requester) : undefined;

  const { data, totalRecords } = await policyRepository.findMany({
    skip,
    take: query.limit,
    search: query.search,
    status: query.status,
    policyType: query.policyType,
    expired: query.expired,
    minPremium: query.minPremium,
    maxPremium: query.maxPremium,
    customerId,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });

  return {
    data: data.map(toPolicyDto),
    meta: buildPaginationMeta(totalRecords, query.page, query.limit),
  };
}

export async function updatePolicy(id: string, input: UpdatePolicyInput): Promise<PolicyDto> {
  const existing = await policyRepository.findById(id);
  if (!existing) {
    throw new NotFoundError('Policy not found');
  }

  const nextStartDate = input.startDate ?? existing.startDate;
  const nextEndDate = input.endDate ?? existing.endDate;
  if (nextEndDate <= nextStartDate) {
    throw new BadRequestError('endDate must be after startDate');
  }

  const updated = await policyRepository.update(id, input);
  return toPolicyDto(updated);
}

export async function cancelPolicy(id: string): Promise<PolicyDto> {
  const existing = await policyRepository.findById(id);
  if (!existing) {
    throw new NotFoundError('Policy not found');
  }

  if (existing.status === 'CANCELLED') {
    throw new BadRequestError('Policy is already cancelled');
  }

  const updated = await policyRepository.update(id, { status: 'CANCELLED' });
  return toPolicyDto(updated);
}

export async function renewPolicy(id: string, input: RenewPolicyInput): Promise<PolicyDto> {
  const existing = await policyRepository.findById(id);
  if (!existing) {
    throw new NotFoundError('Policy not found');
  }

  if (existing.status === 'CANCELLED') {
    throw new BadRequestError('Cancelled policies cannot be renewed');
  }
  if (existing.status === 'RENEWED') {
    throw new BadRequestError('This policy has already been renewed');
  }

  const policyNumber = await generatePolicyNumber();

  const renewed = await policyRepository.renew(id, {
    policyNumber,
    customerId: existing.customerId,
    policyType: existing.policyType,
    premiumAmount: input.premiumAmount ?? existing.premiumAmount,
    coverageAmount: input.coverageAmount ?? existing.coverageAmount,
    startDate: input.startDate,
    endDate: input.endDate,
    description: existing.description,
  });

  return toPolicyDto(renewed);
}

export async function deletePolicy(id: string): Promise<void> {
  const existing = await policyRepository.findById(id);
  if (!existing) {
    throw new NotFoundError('Policy not found');
  }
  await policyRepository.softDelete(id);
}
