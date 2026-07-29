import type { Document, DocumentEntityType, DocumentType } from '@prisma/client';

export interface DocumentDto {
  id: string;
  entityType: DocumentEntityType;
  entityId: string;
  documentType: DocumentType;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * `storedFileName` and `storagePath` are deliberately excluded from the DTO
 * — per the spec's "never expose internal storage paths" rule, clients only
 * ever see the document's id and use GET /documents/:id/download to fetch
 * bytes; they never learn where or how it's physically stored.
 */
export function toDocumentDto(document: Document): DocumentDto {
  return {
    id: document.id,
    entityType: document.entityType,
    entityId: document.entityId,
    documentType: document.documentType,
    originalFileName: document.originalFileName,
    mimeType: document.mimeType,
    fileSize: document.fileSize,
    uploadedBy: document.uploadedBy,
    uploadedAt: document.uploadedAt,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}
