import type { Prisma, PolicyStatus, PolicyType } from '@prisma/client';
import { prisma } from '@lib/prisma.js';

export interface FindManyOptions {
  skip: number;
  take: number;
  search?: string;
  status?: PolicyStatus;
  policyType?: PolicyType;
  expired?: boolean;
  customerId?: string;
  sortBy: 'startDate' | 'endDate' | 'premiumAmount';
  sortOrder: 'asc' | 'desc';
}

const notDeleted: Prisma.PolicyWhereInput = { deletedAt: null };

function buildWhere(options: FindManyOptions): Prisma.PolicyWhereInput {
  const where: Prisma.PolicyWhereInput = { ...notDeleted };

  if (options.customerId) {
    where.customerId = options.customerId;
  }

  if (options.status) {
    where.status = options.status;
  }

  if (options.policyType) {
    where.policyType = options.policyType;
  }

  if (options.expired !== undefined) {
    where.endDate = options.expired ? { lt: new Date() } : { gte: new Date() };
  }

  if (options.search) {
    where.OR = [
      { policyNumber: { contains: options.search, mode: 'insensitive' } },
      { policyType: { equals: options.search.toUpperCase() as PolicyType } },
      { customer: { fullName: { contains: options.search, mode: 'insensitive' } } },
    ];
  }

  return where;
}

export const policyRepository = {
  async create(data: Prisma.PolicyCreateInput) {
    return prisma.policy.create({ data });
  },

  async findById(id: string) {
    return prisma.policy.findFirst({ where: { id, ...notDeleted } });
  },

  async findMany(options: FindManyOptions) {
    const where = buildWhere(options);

    const [data, totalRecords] = await prisma.$transaction([
      prisma.policy.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: { [options.sortBy]: options.sortOrder },
      }),
      prisma.policy.count({ where }),
    ]);

    return { data, totalRecords };
  },

  async update(id: string, data: Prisma.PolicyUpdateInput) {
    return prisma.policy.update({ where: { id }, data });
  },

  async softDelete(id: string) {
    return prisma.policy.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  /**
   * Renews a policy in a single transaction: the original row's status
   * becomes RENEWED (its dates are never mutated — full history preserved),
   * and a brand-new Policy row is created for the new period, linked back
   * via renewedFromId.
   */
  async renew(
    originalId: string,
    newPeriod: {
      policyNumber: string;
      customerId: string;
      policyType: PolicyType;
      premiumAmount: Prisma.Decimal | number;
      coverageAmount: Prisma.Decimal | number;
      startDate: Date;
      endDate: Date;
      description: string | null;
    },
  ) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.policy.update({
        where: { id: originalId },
        data: { status: 'RENEWED' },
      });

      return tx.policy.create({
        data: {
          policyNumber: newPeriod.policyNumber,
          policyType: newPeriod.policyType,
          premiumAmount: newPeriod.premiumAmount,
          coverageAmount: newPeriod.coverageAmount,
          startDate: newPeriod.startDate,
          endDate: newPeriod.endDate,
          description: newPeriod.description,
          status: 'ACTIVE',
          customer: { connect: { id: newPeriod.customerId } },
          renewedFrom: { connect: { id: originalId } },
        },
      });
    });
  },
};
