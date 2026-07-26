import type { Prisma, ClaimStatus, ClaimType } from '@prisma/client';
import { prisma } from '@lib/prisma.js';

export interface FindManyOptions {
  skip: number;
  take: number;
  search?: string;
  status?: ClaimStatus;
  claimType?: ClaimType;
  policyId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  customerId?: string;
  sortBy: 'claimDate' | 'incidentDate' | 'claimAmount';
  sortOrder: 'asc' | 'desc';
}

const notDeleted: Prisma.ClaimWhereInput = { deletedAt: null };

function buildWhere(options: FindManyOptions): Prisma.ClaimWhereInput {
  const where: Prisma.ClaimWhereInput = { ...notDeleted };

  if (options.policyId) {
    where.policyId = options.policyId;
  }

  if (options.customerId) {
    where.policy = { customerId: options.customerId };
  }

  if (options.status) {
    where.status = options.status;
  }

  if (options.claimType) {
    where.claimType = options.claimType;
  }

  if (options.dateFrom || options.dateTo) {
    where.claimDate = {
      ...(options.dateFrom ? { gte: options.dateFrom } : {}),
      ...(options.dateTo ? { lte: options.dateTo } : {}),
    };
  }

  if (options.search) {
    where.OR = [
      { claimNumber: { contains: options.search, mode: 'insensitive' } },
      { policy: { policyNumber: { contains: options.search, mode: 'insensitive' } } },
      { policy: { customer: { fullName: { contains: options.search, mode: 'insensitive' } } } },
    ];
  }

  return where;
}

export const claimRepository = {
  async create(data: Prisma.ClaimCreateInput) {
    return prisma.claim.create({ data });
  },

  async findById(id: string) {
    return prisma.claim.findFirst({ where: { id, ...notDeleted } });
  },

  async findMany(options: FindManyOptions) {
    const where = buildWhere(options);

    const [data, totalRecords] = await prisma.$transaction([
      prisma.claim.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: { [options.sortBy]: options.sortOrder },
      }),
      prisma.claim.count({ where }),
    ]);

    return { data, totalRecords };
  },

  async update(id: string, data: Prisma.ClaimUpdateInput) {
    return prisma.claim.update({ where: { id }, data });
  },
};
