import type { DocumentEntityType, Role } from '@prisma/client';
import { documentRepository } from '@repositories/document.repository.js';
import { customerRepository } from '@repositories/customer.repository.js';
import { policyRepository } from '@repositories/policy.repository.js';
import { claimRepository } from '@repositories/claim.repository.js';
import { storageService } from '@services/storage/index.js';
import { generateStoredFileName, subdirectoryForEntityType } from '@utils/fileStorage.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '@utils/AppError.js';
import { buildPaginationMeta, type PaginatedResult } from '@app-types/pagination.types.js';
import { toDocumentDto, type DocumentDto } from '@app-types/document.types.js';
import type {
  DocumentSearchQuery,
  UploadDocumentMetadataInput,
} from '@validators/document.validator.js';

interface RequestingUser {
  userId: string;
  role: Role;
}

interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/** Resolves the owning customerId for a given (entityType, entityId), or
 * throws if the target entity doesn't exist. Also the single place that
 * enforces "every document belongs to exactly one *existing* entity". */
async function resolveOwningCustomerId(
  entityType: DocumentEntityType,
  entityId: string,
): Promise<string> {
  if (entityType === 'CUSTOMER') {
    const customer = await customerRepository.findById(entityId);
    if (!customer) throw new BadRequestError('Target customer does not exist');
    return customer.id;
  }

  if (entityType === 'POLICY') {
    const policy = await policyRepository.findById(entityId);
    if (!policy) throw new BadRequestError('Target policy does not exist');
    return policy.customerId;
  }

  // CLAIM
  const claim = await claimRepository.findById(entityId);
  if (!claim) throw new BadRequestError('Target claim does not exist');
  const policy = await policyRepository.findById(claim.policyId);
  if (!policy) throw new BadRequestError('Target claim does not exist');
  return policy.customerId;
}

async function assertCanAccessDocument(
  entityType: DocumentEntityType,
  entityId: string,
  requester: RequestingUser,
): Promise<void> {
  if (requester.role === 'ADMIN' || requester.role === 'AGENT') return;

  const customer = await customerRepository.findByUserId(requester.userId);
  if (!customer) {
    throw new ForbiddenError('No customer profile is linked to this account');
  }

  const owningCustomerId = await resolveOwningCustomerId(entityType, entityId);
  if (owningCustomerId !== customer.id) {
    throw new ForbiddenError('You do not have access to this document');
  }
}

export async function uploadDocument(
  metadata: UploadDocumentMetadataInput,
  file: UploadedFile,
  requester: RequestingUser,
): Promise<DocumentDto> {
  // Confirms the target entity exists — required regardless of role.
  await resolveOwningCustomerId(metadata.entityType, metadata.entityId);

  const storedFileName = generateStoredFileName(file.originalname);
  const subdirectory = subdirectoryForEntityType(metadata.entityType);
  const storagePath = await storageService.save(subdirectory, storedFileName, file.buffer);

  const document = await documentRepository.create({
    entityType: metadata.entityType,
    entityId: metadata.entityId,
    documentType: metadata.documentType,
    originalFileName: file.originalname,
    storedFileName,
    mimeType: file.mimetype,
    fileSize: file.size,
    storagePath,
    uploadedByUser: { connect: { id: requester.userId } },
  });

  return toDocumentDto(document);
}

export async function getDocumentById(id: string, requester: RequestingUser): Promise<DocumentDto> {
  const document = await documentRepository.findById(id);
  if (!document) {
    throw new NotFoundError('Document not found');
  }

  await assertCanAccessDocument(document.entityType, document.entityId, requester);

  return toDocumentDto(document);
}

export interface DownloadPayload {
  buffer: Buffer;
  originalFileName: string;
  mimeType: string;
}

export async function downloadDocument(
  id: string,
  requester: RequestingUser,
): Promise<DownloadPayload> {
  const document = await documentRepository.findById(id);
  if (!document) {
    throw new NotFoundError('Document not found');
  }

  await assertCanAccessDocument(document.entityType, document.entityId, requester);

  const buffer = await storageService.read(document.storagePath);

  return {
    buffer,
    originalFileName: document.originalFileName,
    mimeType: document.mimeType,
  };
}

export async function listDocuments(
  query: DocumentSearchQuery,
  requester: RequestingUser,
): Promise<PaginatedResult<DocumentDto>> {
  const skip = (query.page - 1) * query.limit;

  let ownedEntityIds:
    { customerIds: string[]; policyIds: string[]; claimIds: string[] } | undefined;

  if (requester.role === 'CUSTOMER') {
    const customer = await customerRepository.findByUserId(requester.userId);
    if (!customer) {
      throw new ForbiddenError('No customer profile is linked to this account');
    }
    const [policyIds, claimIds] = await Promise.all([
      policyRepository.findAllIdsByCustomerId(customer.id),
      claimRepository.findAllIdsByCustomerId(customer.id),
    ]);
    ownedEntityIds = { customerIds: [customer.id], policyIds, claimIds };
  }

  const { data, totalRecords } = await documentRepository.findMany({
    skip,
    take: query.limit,
    search: query.search,
    entityType: query.entityType,
    documentType: query.documentType,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    ownedEntityIds,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });

  return {
    data: data.map(toDocumentDto),
    meta: buildPaginationMeta(totalRecords, query.page, query.limit),
  };
}

export async function deleteDocument(id: string): Promise<void> {
  const existing = await documentRepository.findById(id);
  if (!existing) {
    throw new NotFoundError('Document not found');
  }
  // Soft delete only — the underlying file is intentionally left on disk.
  // Physically deleting on every soft-delete would make the operation
  // unrecoverable and complicate any future "restore" feature; the file is
  // simply no longer reachable through the API since findById/findMany both
  // filter deletedAt: null.
  await documentRepository.softDelete(id);
}
