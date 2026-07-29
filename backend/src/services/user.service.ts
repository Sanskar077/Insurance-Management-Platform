import { userRepository } from '@repositories/user.repository.js';
import { hashPassword } from '@utils/password.js';
import { BadRequestError, ConflictError, NotFoundError } from '@utils/AppError.js';
import { buildPaginationMeta, type PaginatedResult } from '@app-types/pagination.types.js';
import { toUserDto, type UserDto } from '@app-types/user.types.js';
import type {
  CreateUserInput,
  UpdateUserRoleInput,
  UserSearchQuery,
} from '@validators/user.validator.js';

export async function listUsers(query: UserSearchQuery): Promise<PaginatedResult<UserDto>> {
  const skip = (query.page - 1) * query.limit;

  const { data, totalRecords } = await userRepository.findMany({
    skip,
    take: query.limit,
    search: query.search,
    role: query.role,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });

  return {
    data: data.map(toUserDto),
    meta: buildPaginationMeta(totalRecords, query.page, query.limit),
  };
}

export async function getUserById(id: string): Promise<UserDto> {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return toUserDto(user);
}

/**
 * ADMIN-only staff account creation (ADMIN / AGENT). CUSTOMER accounts are
 * never created here — they go through customer registration so the
 * User+Customer profile invariant is preserved.
 */
export async function createUser(input: CreateUserInput): Promise<UserDto> {
  const existing = await userRepository.findByEmail(input.email);
  if (existing) {
    throw new ConflictError('An account with this email already exists');
  }

  const password = await hashPassword(input.password);

  const user = await userRepository.create({
    name: input.name,
    email: input.email,
    password,
    role: input.role,
  });

  return toUserDto(user);
}

/**
 * Role changes are restricted to staff roles, with two safety rules:
 * - No self-changes: an ADMIN cannot alter their own role (also guarantees
 *   the system can never drop to zero ADMINs — removing the last ADMIN
 *   would necessarily be a self-demotion).
 * - Users with a linked Customer profile stay CUSTOMER: their login is tied
 *   to business records, and promoting it would break the one-to-one
 *   User↔Customer design.
 */
export async function updateUserRole(
  id: string,
  input: UpdateUserRoleInput,
  requesterUserId: string,
): Promise<UserDto> {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.id === requesterUserId) {
    throw new BadRequestError('You cannot change your own role');
  }

  if (user.customer) {
    throw new BadRequestError('This account belongs to a customer and must keep the CUSTOMER role');
  }

  if (user.role === input.role) {
    return toUserDto(user);
  }

  const updated = await userRepository.updateRole(id, input.role);
  return toUserDto(updated);
}
