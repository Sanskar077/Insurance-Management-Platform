import type { Role } from '@prisma/client';
import { customerRepository } from '@repositories/customer.repository.js';
import { createUserWithCustomerProfile } from '@services/auth.service.js';
import { generateTemporaryPassword } from '@utils/password.js';
import { ConflictError, ForbiddenError, NotFoundError } from '@utils/AppError.js';
import { buildPaginationMeta, type PaginatedResult } from '@app-types/pagination.types.js';
import { toCustomerDto, type CustomerDto } from '@app-types/customer.types.js';
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
  UpdateOwnCustomerInput,
} from '@validators/customer.validator.js';

interface RequestingUser {
  userId: string;
  role: Role;
}

async function assertCanAccessCustomer(
  customerId: string,
  requester: RequestingUser,
): Promise<void> {
  if (requester.role === 'ADMIN' || requester.role === 'AGENT') return;

  // CUSTOMER role: may only access their own profile.
  const customer = await customerRepository.findById(customerId);
  if (!customer || customer.userId !== requester.userId) {
    throw new ForbiddenError('You do not have access to this customer profile');
  }
}

export interface CreateCustomerResult {
  customer: CustomerDto;
  temporaryPassword: string;
}

export async function createCustomer(input: CreateCustomerInput): Promise<CreateCustomerResult> {
  const existing = await customerRepository.findByEmail(input.email);
  if (existing) {
    throw new ConflictError('A customer with this email already exists');
  }

  const temporaryPassword = generateTemporaryPassword();

  const { customer } = await createUserWithCustomerProfile({
    name: input.fullName,
    email: input.email,
    password: temporaryPassword,
    fullName: input.fullName,
    dob: input.dob,
    phone: input.phone,
    address: input.address,
  });

  return { customer: toCustomerDto(customer), temporaryPassword };
}

export async function getCustomerById(id: string, requester: RequestingUser): Promise<CustomerDto> {
  await assertCanAccessCustomer(id, requester);

  const customer = await customerRepository.findById(id);
  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  return toCustomerDto(customer);
}

export async function getOwnProfile(requester: RequestingUser): Promise<CustomerDto> {
  const customer = await customerRepository.findByUserId(requester.userId);
  if (!customer) {
    throw new NotFoundError('Customer profile not found');
  }
  return toCustomerDto(customer);
}

export async function listCustomers(
  page: number,
  limit: number,
  search: string | undefined,
): Promise<PaginatedResult<CustomerDto>> {
  const skip = (page - 1) * limit;
  const { data, totalRecords } = await customerRepository.findMany({
    skip,
    take: limit,
    search,
  });

  return {
    data: data.map(toCustomerDto),
    meta: buildPaginationMeta(totalRecords, page, limit),
  };
}

export async function updateCustomer(
  id: string,
  input: UpdateCustomerInput | UpdateOwnCustomerInput,
  requester: RequestingUser,
): Promise<CustomerDto> {
  await assertCanAccessCustomer(id, requester);

  const existing = await customerRepository.findById(id);
  if (!existing) {
    throw new NotFoundError('Customer not found');
  }

  if ('email' in input && input.email && input.email !== existing.email) {
    const emailOwner = await customerRepository.findByEmail(input.email);
    if (emailOwner) {
      throw new ConflictError('A customer with this email already exists');
    }
  }

  const updated = await customerRepository.update(id, input);
  return toCustomerDto(updated);
}

export async function deleteCustomer(id: string): Promise<void> {
  const existing = await customerRepository.findById(id);
  if (!existing) {
    throw new NotFoundError('Customer not found');
  }
  await customerRepository.softDelete(id);
}

/**
 * Placeholder only — structure for the future Customer History feature
 * (policy/claim/payment timeline). No business logic yet; scoped for a
 * later session per the Day 3 spec.
 */
export async function getCustomerHistoryPlaceholder(
  id: string,
  requester: RequestingUser,
): Promise<{ customerId: string; events: unknown[] }> {
  await assertCanAccessCustomer(id, requester);

  const customer = await customerRepository.findById(id);
  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  return { customerId: id, events: [] };
}
