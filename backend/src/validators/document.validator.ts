import { z } from 'zod';
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '@constants/pagination.js';

export const DOCUMENT_ENTITY_TYPES = ['CUSTOMER', 'POLICY', 'CLAIM'] as const;
export const DOCUMENT_TYPES = [
  'ID_PROOF',
  'ADDRESS_PROOF',
  'POLICY_DOCUMENT',
  'CLAIM_DOCUMENT',
  'PHOTO',
  'OTHER',
] as const;

/**
 * Validates the metadata fields submitted alongside the file (multipart
 * fields arrive as strings, so entityType/documentType are validated as
 * enums same as JSON bodies elsewhere — Multer runs before this, so
 * req.file is already populated by the time this schema sees req.body).
 */
export const uploadDocumentMetadataSchema = z.object({
  entityType: z.enum(DOCUMENT_ENTITY_TYPES),
  entityId: z.uuid('Invalid entity id'),
  documentType: z.enum(DOCUMENT_TYPES),
});

export type UploadDocumentMetadataInput = z.infer<typeof uploadDocumentMetadataSchema>;

export const documentSearchQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  search: z.string().trim().min(1).optional(),
  entityType: z.enum(DOCUMENT_ENTITY_TYPES).optional(),
  documentType: z.enum(DOCUMENT_TYPES).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sortBy: z.enum(['uploadedAt', 'fileSize', 'originalFileName']).default('uploadedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type DocumentSearchQuery = z.infer<typeof documentSearchQuerySchema>;

export const documentIdParamSchema = z.object({
  id: z.uuid('Invalid document id'),
});
