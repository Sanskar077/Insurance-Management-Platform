import type { Prisma, DocumentEntityType, DocumentType } from '@prisma/client';
import { prisma } from '@lib/prisma.js';

export interface FindManyOptions {
  skip: number;
  take: number;
  search?: string;
  entityType?: DocumentEntityType;
  documentType?: DocumentType;
  dateFrom?: Date;
  dateTo?: Date;
  /** Restricts results to documents attached to exactly this entity. */
  entityFilter?: { entityType: DocumentEntityType; entityId: string };
  /** Restricts results to documents owned (transitively) by this customer — used for CUSTOMER-role scoping. */
  ownedEntityIds?: { customerIds: string[]; policyIds: string[]; claimIds: string[] };
  sortBy: 'uploadedAt' | 'fileSize' | 'originalFileName';
  sortOrder: 'asc' | 'desc';
}

const notDeleted: Prisma.DocumentWhereInput = { deletedAt: null };

/**
 * Resolves free-text `search` against the three entity tables Documents can
 * attach to (no direct Prisma relation exists for a polymorphic FK), plus
 * the document's own originalFileName. Returns an OR clause combining a
 * direct filename match with entityId-in-list matches per entity type.
 */
async function buildSearchWhere(search: string): Promise<Prisma.DocumentWhereInput> {
  const [matchingCustomers, matchingPolicies, matchingClaims] = await Promise.all([
    prisma.customer.findMany({
      where: { fullName: { contains: search, mode: 'insensitive' }, deletedAt: null },
      select: { id: true },
    }),
    prisma.policy.findMany({
      where: { policyNumber: { contains: search, mode: 'insensitive' }, deletedAt: null },
      select: { id: true },
    }),
    prisma.claim.findMany({
      where: { claimNumber: { contains: search, mode: 'insensitive' }, deletedAt: null },
      select: { id: true },
    }),
  ]);

  const or: Prisma.DocumentWhereInput[] = [
    { originalFileName: { contains: search, mode: 'insensitive' } },
  ];

  if (matchingCustomers.length > 0) {
    or.push({
      entityType: 'CUSTOMER',
      entityId: { in: matchingCustomers.map((c: { id: string }) => c.id) },
    });
  }
  if (matchingPolicies.length > 0) {
    or.push({
      entityType: 'POLICY',
      entityId: { in: matchingPolicies.map((p: { id: string }) => p.id) },
    });
  }
  if (matchingClaims.length > 0) {
    or.push({
      entityType: 'CLAIM',
      entityId: { in: matchingClaims.map((c: { id: string }) => c.id) },
    });
  }

  return { OR: or };
}

function buildOwnershipWhere(
  owned: NonNullable<FindManyOptions['ownedEntityIds']>,
): Prisma.DocumentWhereInput {
  return {
    OR: [
      { entityType: 'CUSTOMER', entityId: { in: owned.customerIds } },
      { entityType: 'POLICY', entityId: { in: owned.policyIds } },
      { entityType: 'CLAIM', entityId: { in: owned.claimIds } },
    ],
  };
}

async function buildWhere(options: FindManyOptions): Promise<Prisma.DocumentWhereInput> {
  const clauses: Prisma.DocumentWhereInput[] = [notDeleted];

  if (options.entityFilter) {
    clauses.push({
      entityType: options.entityFilter.entityType,
      entityId: options.entityFilter.entityId,
    });
  }

  if (options.ownedEntityIds) {
    clauses.push(buildOwnershipWhere(options.ownedEntityIds));
  }

  if (options.entityType) {
    clauses.push({ entityType: options.entityType });
  }

  if (options.documentType) {
    clauses.push({ documentType: options.documentType });
  }

  if (options.dateFrom || options.dateTo) {
    clauses.push({
      uploadedAt: {
        ...(options.dateFrom ? { gte: options.dateFrom } : {}),
        ...(options.dateTo ? { lte: options.dateTo } : {}),
      },
    });
  }

  if (options.search) {
    clauses.push(await buildSearchWhere(options.search));
  }

  return { AND: clauses };
}

export const documentRepository = {
  async create(data: Prisma.DocumentCreateInput) {
    return prisma.document.create({ data });
  },

  async findById(id: string) {
    return prisma.document.findFirst({ where: { id, ...notDeleted } });
  },

  async findMany(options: FindManyOptions) {
    const where = await buildWhere(options);

    const [data, totalRecords] = await prisma.$transaction([
      prisma.document.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: { [options.sortBy]: options.sortOrder },
      }),
      prisma.document.count({ where }),
    ]);

    return { data, totalRecords };
  },

  async softDelete(id: string) {
    return prisma.document.update({ where: { id }, data: { deletedAt: new Date() } });
  },
};
