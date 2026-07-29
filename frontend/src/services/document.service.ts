import { getAuthToken, ApiError } from '@lib/apiClient';
import type {
  DocumentEntityType,
  DocumentRecord,
  DocumentType,
  PaginatedDocuments,
} from '@app-types/document.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

interface ApiEnvelope<T> {
  success: true;
  data: T;
}

interface ListEnvelope {
  success: true;
  data: DocumentRecord[];
  meta: PaginatedDocuments['meta'];
}

export interface ListDocumentsParams {
  page: number;
  limit: number;
  search?: string;
  entityType?: DocumentEntityType;
  documentType?: DocumentType;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'uploadedAt' | 'fileSize' | 'originalFileName';
  sortOrder?: 'asc' | 'desc';
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

async function jsonRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(payload?.message ?? 'Request failed', response.status, payload?.errors);
  }
  return payload as T;
}

export async function listDocuments(params: ListDocumentsParams): Promise<PaginatedDocuments> {
  const query = buildQuery({
    page: params.page,
    limit: params.limit,
    search: params.search,
    entityType: params.entityType,
    documentType: params.documentType,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });
  const result = await jsonRequest<ListEnvelope>(`/documents${query}`);
  return { data: result.data, meta: result.meta };
}

export async function getDocumentById(id: string): Promise<DocumentRecord> {
  const result = await jsonRequest<ApiEnvelope<DocumentRecord>>(`/documents/${id}`);
  return result.data;
}

export async function deleteDocument(id: string): Promise<void> {
  await jsonRequest<{ success: true; message: string }>(`/documents/${id}`, {
    method: 'DELETE',
  });
}

interface UploadSuccessPayload {
  success: true;
  data: DocumentRecord;
}

interface UploadErrorPayload {
  message?: string;
  errors?: { path: string; message: string }[];
}

/**
 * Uses XMLHttpRequest (not fetch) specifically because fetch has no upload
 * progress events — the spec requires a real progress indicator, and
 * `xhr.upload.onprogress` is the only standard browser API that provides it.
 */
export function uploadDocument(
  file: File,
  metadata: { entityType: DocumentEntityType; entityId: string; documentType: DocumentType },
  onProgress: (percent: number) => void,
): Promise<DocumentRecord> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', metadata.entityType);
    formData.append('entityId', metadata.entityId);
    formData.append('documentType', metadata.documentType);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}/documents`);

    const token = getAuthToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let payload: UploadSuccessPayload | UploadErrorPayload | null;
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        payload = null;
      }

      if (xhr.status >= 200 && xhr.status < 300 && payload && 'data' in payload) {
        resolve(payload.data);
      } else {
        const message = (payload && 'message' in payload && payload.message) || 'Upload failed';
        const errors = (payload && 'errors' in payload && payload.errors) || undefined;
        reject(new ApiError(message, xhr.status, errors));
      }
    };

    xhr.onerror = () => reject(new ApiError('Network error during upload', 0));

    xhr.send(formData);
  });
}

/** Downloads the file and triggers the browser's native save flow. */
export async function downloadDocument(id: string, fileName: string): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/documents/${id}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new ApiError(payload?.message ?? 'Download failed', response.status);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
