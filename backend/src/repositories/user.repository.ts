import type { Prisma, Role } from '@prisma/client';
import { prisma } from '@lib/prisma.js';

export interface FindManyOptions {
  skip: number;
  take: number;
  search?: string;
  role?: Role;
  sortBy: 'name' | 'email' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

/** Always join the linked customer id so DTOs can expose hasCustomerProfile. */
const withCustomerId = { customer: { select: { id: true } } } as const;

function buildWhere(options: FindManyOptions): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};

  if (options.role) {
    where.role = options.role;
  }

  if (options.search) {
    where.OR = [
      { name: { contains: options.search, mode: 'insensitive' } },
      { email: { contains: options.search, mode: 'insensitive' } },
    ];
  }

  return where;
}

export const userRepository = {
  async findMany(options: FindManyOptions) {
    const where = buildWhere(options);

    const [data, totalRecords] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: { [options.sortBy]: options.sortOrder },
        include: withCustomerId,
      }),
      prisma.user.count({ where }),
    ]);

    return { data, totalRecords };
  },

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id }, include: withCustomerId });
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email }, include: withCustomerId });
  },

  async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data, include: withCustomerId });
  },

  async updateRole(id: string, role: Role) {
    return prisma.user.update({ where: { id }, data: { role }, include: withCustomerId });
  },
};
