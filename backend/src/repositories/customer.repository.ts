import type { Prisma } from '@prisma/client';
import { prisma } from '@lib/prisma.js';

export interface FindManyOptions {
  skip: number;
  take: number;
  search?: string;
  sortBy?: 'fullName' | 'createdAt' | 'dob';
  sortOrder?: 'asc' | 'desc';
}

const notDeleted: Prisma.CustomerWhereInput = { deletedAt: null };

function buildSearchWhere(search?: string): Prisma.CustomerWhereInput {
  if (!search) return {};
  return {
    OR: [
      { fullName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ],
  };
}

export const customerRepository = {
  async create(data: Prisma.CustomerCreateInput) {
    return prisma.customer.create({ data });
  },

  async findById(id: string) {
    return prisma.customer.findFirst({ where: { id, ...notDeleted } });
  },

  /** Includes soft-deleted rows too — used for internal checks (e.g. email uniqueness). */
  async findByIdIncludingDeleted(id: string) {
    return prisma.customer.findUnique({ where: { id } });
  },

  async findByUserId(userId: string) {
    return prisma.customer.findFirst({ where: { userId, ...notDeleted } });
  },

  async findByEmail(email: string) {
    return prisma.customer.findFirst({ where: { email, ...notDeleted } });
  },

  async findMany({
    skip,
    take,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }: FindManyOptions) {
    const where: Prisma.CustomerWhereInput = {
      ...notDeleted,
      ...buildSearchWhere(search),
    };

    const [data, totalRecords] = await prisma.$transaction([
      prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.customer.count({ where }),
    ]);

    return { data, totalRecords };
  },

  async update(id: string, data: Prisma.CustomerUpdateInput) {
    return prisma.customer.update({ where: { id }, data });
  },

  async softDelete(id: string) {
    return prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
