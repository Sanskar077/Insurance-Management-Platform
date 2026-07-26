import type { ClaimStatus, Role } from '@prisma/client';
import { claimRepository } from '@repositories/claim.repository.js';
import { policyRepository } from '@repositories/policy.repository.js';
import { customerRepository } from '@repositories/customer.repository.js';
import { generateClaimNumber } from '@utils/claimNumber.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '@utils/AppError.js';
import { buildPaginationMeta, type PaginatedResult } from '@app-types/pagination.types.js';
import { toClaimDto, type ClaimDto } from '@app-types/claim.types.js';
import type {
  ApproveClaimInput,
  ClaimSearchQuery,
  CloseClaimInput,
  CreateClaimInput,
  RejectClaimInput,
  UpdateClaimInput,
} from '@validators/claim.validator.js';

interface RequestingUser {
  userId: string;
  role: Role;
}

/**
 * Workflow: SUBMITTED -> UNDER_REVIEW -> APPROVED | REJECTED -> CLOSED.
 * Enforced centrally here so no route can push a claim through an invalid
 * transition. See docs/claim-management.md for the full diagram and the
 * reasoning behind the "review" transition (no standalone endpoint exists
 * for it per the Day 6 REST API spec — it's folded into PUT /claims/:id).
 */
const ALLOWED_TRANSITIONS: Record<ClaimStatus, ClaimStatus[]> = {
  SUBMITTED: ['UNDER_REVIEW', 'APPROVED', 'REJECTED'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['CLOSED'],
  REJECTED: ['CLOSED'],
  CLOSED: [],
};

function assertTransitionAllowed(current: ClaimStatus, next: ClaimStatus): void {
  if (!ALLOWED_TRANSITIONS[current].includes(next)) {
    throw new BadRequestError(`Cannot move a claim from ${current} to ${next}`);
  }
}

function assertNotClosed(status: ClaimStatus): void {
  if (status === 'CLOSED') {
    throw new BadRequestError('Closed claims cannot be modified');
  }
}

async function resolveOwnCustomerId(requester: RequestingUser): Promise<string> {
  const customer = await customerRepository.findByUserId(requester.userId);
  if (!customer) {
    throw new ForbiddenError('No customer profile is linked to this account');
  }
  return customer.id;
}

async function assertCanAccessClaim(
  policyCustomerId: string,
  requester: RequestingUser,
): Promise<void> {
  if (requester.role === 'ADMIN' || requester.role === 'AGENT') return;

  const ownCustomerId = await resolveOwnCustomerId(requester);
  if (ownCustomerId !== policyCustomerId) {
    throw new ForbiddenError('You do not have access to this claim');
  }
}

export async function createClaim(
  input: CreateClaimInput,
  requester: RequestingUser,
): Promise<ClaimDto> {
  const policy = await policyRepository.findById(input.policyId);
  if (!policy) {
    throw new BadRequestError('A claim must belong to an existing policy');
  }

  if (policy.status === 'CANCELLED') {
    throw new BadRequestError('Cancelled policies cannot accept new claims');
  }

  if (requester.role === 'CUSTOMER') {
    const ownCustomerId = await resolveOwnCustomerId(requester);
    if (policy.customerId !== ownCustomerId) {
      throw new ForbiddenError('You can only file claims for your own policies');
    }
    if (policy.status !== 'ACTIVE') {
      throw new BadRequestError('Claims can only be filed against an active policy');
    }
  }

  const claimNumber = await generateClaimNumber();

  const claim = await claimRepository.create({
    claimNumber,
    claimType: input.claimType,
    claimAmount: input.claimAmount,
    incidentDate: input.incidentDate,
    claimDate: input.claimDate ?? new Date(),
    description: input.description,
    status: 'SUBMITTED',
    policy: { connect: { id: input.policyId } },
  });

  return toClaimDto(claim);
}

export async function getClaimById(id: string, requester: RequestingUser): Promise<ClaimDto> {
  const claim = await claimRepository.findById(id);
  if (!claim) {
    throw new NotFoundError('Claim not found');
  }

  const policy = await policyRepository.findById(claim.policyId);
  if (!policy) {
    throw new NotFoundError('Claim not found');
  }

  await assertCanAccessClaim(policy.customerId, requester);

  return toClaimDto(claim);
}

export async function listClaims(
  query: ClaimSearchQuery,
  requester: RequestingUser,
): Promise<PaginatedResult<ClaimDto>> {
  const skip = (query.page - 1) * query.limit;

  const customerId =
    requester.role === 'CUSTOMER' ? await resolveOwnCustomerId(requester) : undefined;

  if (query.policyId && requester.role === 'CUSTOMER') {
    const policy = await policyRepository.findById(query.policyId);
    if (!policy || policy.customerId !== customerId) {
      throw new ForbiddenError('You do not have access to this policy\u2019s claims');
    }
  }

  const { data, totalRecords } = await claimRepository.findMany({
    skip,
    take: query.limit,
    search: query.search,
    status: query.status,
    claimType: query.claimType,
    policyId: query.policyId,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    customerId,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });

  return {
    data: data.map(toClaimDto),
    meta: buildPaginationMeta(totalRecords, query.page, query.limit),
  };
}

/** ADMIN, AGENT — general field correction. Blocked once CLOSED. Also the
 * sole path for the SUBMITTED -> UNDER_REVIEW transition (see workflow note
 * above), via an optional `status` field. */
export async function updateClaim(id: string, input: UpdateClaimInput): Promise<ClaimDto> {
  const existing = await claimRepository.findById(id);
  if (!existing) {
    throw new NotFoundError('Claim not found');
  }

  assertNotClosed(existing.status);

  if (input.status) {
    assertTransitionAllowed(existing.status, input.status);
  }

  const nextIncidentDate = input.incidentDate ?? existing.incidentDate;
  if (nextIncidentDate > existing.claimDate) {
    throw new BadRequestError('incidentDate cannot be after claimDate');
  }

  const { status, ...fields } = input;

  const updated = await claimRepository.update(id, {
    ...fields,
    ...(status ? { status } : {}),
  });

  return toClaimDto(updated);
}

export async function approveClaim(id: string, input: ApproveClaimInput): Promise<ClaimDto> {
  const existing = await claimRepository.findById(id);
  if (!existing) {
    throw new NotFoundError('Claim not found');
  }

  assertTransitionAllowed(existing.status, 'APPROVED');

  if (input.approvedAmount > Number(existing.claimAmount)) {
    throw new BadRequestError('Approved amount cannot exceed the claim amount');
  }

  const updated = await claimRepository.update(id, {
    status: 'APPROVED',
    approvedAmount: input.approvedAmount,
    remarks: input.remarks ?? existing.remarks,
  });

  return toClaimDto(updated);
}

export async function rejectClaim(id: string, input: RejectClaimInput): Promise<ClaimDto> {
  const existing = await claimRepository.findById(id);
  if (!existing) {
    throw new NotFoundError('Claim not found');
  }

  assertTransitionAllowed(existing.status, 'REJECTED');

  const updated = await claimRepository.update(id, {
    status: 'REJECTED',
    remarks: input.remarks,
  });

  return toClaimDto(updated);
}

export async function closeClaim(id: string, input: CloseClaimInput): Promise<ClaimDto> {
  const existing = await claimRepository.findById(id);
  if (!existing) {
    throw new NotFoundError('Claim not found');
  }

  assertTransitionAllowed(existing.status, 'CLOSED');

  const updated = await claimRepository.update(id, {
    status: 'CLOSED',
    remarks: input.remarks ?? existing.remarks,
  });

  return toClaimDto(updated);
}
