export type DocumentEntityType = 'CUSTOMER' | 'POLICY' | 'CLAIM';
export type DocumentType =
  'ID_PROOF' | 'ADDRESS_PROOF' | 'POLICY_DOCUMENT' | 'CLAIM_DOCUMENT' | 'PHOTO' | 'OTHER';

export interface DocumentRecord {
  id: string;
  entityType: DocumentEntityType;
  entityId: string;
  documentType: DocumentType;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedDocuments {
  data: DocumentRecord[];
  meta: PaginationMeta;
}

export const DOCUMENT_ENTITY_TYPES: DocumentEntityType[] = ['CUSTOMER', 'POLICY', 'CLAIM'];
export const DOCUMENT_TYPES: DocumentType[] = [
  'ID_PROOF',
  'ADDRESS_PROOF',
  'POLICY_DOCUMENT',
  'CLAIM_DOCUMENT',
  'PHOTO',
  'OTHER',
];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
