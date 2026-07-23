import { prisma } from '@lib/prisma.js';
import type { Prisma, User, Customer } from '@prisma/client';
import { hashPassword, comparePassword } from '@utils/password.js';
import { signAccessToken } from '@utils/jwt.js';
import { ConflictError, UnauthorizedError } from '@utils/AppError.js';
import type { RegisterInput, LoginInput } from '@validators/auth.validator.js';

export interface AuthResult {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface CreateCustomerAccountInput {
  name: string;
  email: string;
  password: string;
  fullName: string;
  dob: Date;
  phone: string;
  address: string;
}

/**
 * Creates a User (role CUSTOMER) and its linked Customer profile in a single
 * transaction. Shared by self-registration (`registerUser`) and
 * staff-initiated customer creation (`CustomerService.createCustomer`) so the
 * User+Customer invariant is enforced in exactly one place.
 */
export async function createUserWithCustomerProfile(
  input: CreateCustomerAccountInput,
): Promise<{ user: User; customer: Customer }> {
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });

  if (existingUser) {
    throw new ConflictError('An account with this email already exists');
  }

  const hashedPassword = await hashPassword(input.password);

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: hashedPassword,
        role: 'CUSTOMER',
      },
    });

    const customer = await tx.customer.create({
      data: {
        userId: user.id,
        fullName: input.fullName,
        dob: input.dob,
        phone: input.phone,
        address: input.address,
        email: user.email,
      },
    });

    return { user, customer };
  });
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  if (input.role === 'CUSTOMER') {
    // Validator guarantees these fields are present when role is CUSTOMER.
    const { user } = await createUserWithCustomerProfile({
      name: input.name,
      email: input.email,
      password: input.password,
      fullName: input.fullName!,
      dob: input.dob!,
      phone: input.phone!,
      address: input.address!,
    });

    const token = signAccessToken({ userId: user.id, role: user.role });
    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }

  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });

  if (existingUser) {
    throw new ConflictError('An account with this email already exists');
  }

  const hashedPassword = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashedPassword,
      role: input.role,
    },
  });

  const token = signAccessToken({ userId: user.id, role: user.role });

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isPasswordValid = await comparePassword(input.password, user.password);

  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const token = signAccessToken({ userId: user.id, role: user.role });

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}
