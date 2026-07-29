import type { Prisma, PaymentStatus } from '@prisma/client';
import { prisma } from '@lib/prisma.js';

export interface FindManyOptions {
  skip: number;
  take: number;
  search?: string;
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  policyId?: string;
  customerId?: string;
  sortBy: 'dueDate' | 'paymentDate' | 'amount';
  sortOrder: 'asc' | 'desc';
}

function buildWhere(options: FindManyOptions): Prisma.PremiumPaymentWhereInput {
  const where: Prisma.PremiumPaymentWhereInput = {};

  if (options.policyId) {
    where.policyId = options.policyId;
  }

  if (options.customerId) {
    where.policy = { customerId: options.customerId };
  }

  if (options.paymentStatus) {
    where.paymentStatus = options.paymentStatus;
  }

  if (options.paymentMethod) {
    where.paymentMethod = options.paymentMethod;
  }

  if (options.dateFrom || options.dateTo) {
    where.dueDate = {
      ...(options.dateFrom ? { gte: options.dateFrom } : {}),
      ...(options.dateTo ? { lte: options.dateTo } : {}),
    };
  }

  if (options.minAmount !== undefined || options.maxAmount !== undefined) {
    where.amount = {
      ...(options.minAmount !== undefined ? { gte: options.minAmount } : {}),
      ...(options.maxAmount !== undefined ? { lte: options.maxAmount } : {}),
    };
  }

  if (options.search) {
    where.OR = [
      { transactionReference: { contains: options.search, mode: 'insensitive' } },
      { policy: { policyNumber: { contains: options.search, mode: 'insensitive' } } },
      { policy: { customer: { fullName: { contains: options.search, mode: 'insensitive' } } } },
    ];
  }

  return where;
}

/** Shared predicate for "overdue" — dueDate in the past AND still PENDING. */
function overdueWhere(
  extra: Prisma.PremiumPaymentWhereInput = {},
): Prisma.PremiumPaymentWhereInput {
  return {
    ...extra,
    paymentStatus: 'PENDING',
    dueDate: { lt: new Date() },
  };
}

export const premiumPaymentRepository = {
  async create(data: Prisma.PremiumPaymentCreateInput) {
    return prisma.premiumPayment.create({ data });
  },

  async findById(id: string) {
    return prisma.premiumPayment.findUnique({ where: { id } });
  },

  async findByTransactionReference(transactionReference: string) {
    return prisma.premiumPayment.findUnique({ where: { transactionReference } });
  },

  async findMany(options: FindManyOptions) {
    const where = buildWhere(options);

    const [data, totalRecords] = await prisma.$transaction([
      prisma.premiumPayment.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: { [options.sortBy]: options.sortOrder },
      }),
      prisma.premiumPayment.count({ where }),
    ]);

    return { data, totalRecords };
  },

  async findOverdue(skip: number, take: number, customerId?: string) {
    const where = overdueWhere(customerId ? { policy: { customerId } } : {});

    const [data, totalRecords] = await prisma.$transaction([
      prisma.premiumPayment.findMany({ where, skip, take, orderBy: { dueDate: 'asc' } }),
      prisma.premiumPayment.count({ where }),
    ]);

    return { data, totalRecords };
  },

  async update(id: string, data: Prisma.PremiumPaymentUpdateInput) {
    return prisma.premiumPayment.update({ where: { id }, data });
  },
};
