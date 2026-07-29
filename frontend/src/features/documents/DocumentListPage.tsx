import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { deleteDocument, downloadDocument, listDocuments } from '@services/document.service';
import type { DocumentEntityType, DocumentRecord, DocumentType } from '@app-types/document.types';
import { DOCUMENT_ENTITY_TYPES, DOCUMENT_TYPES, formatFileSize } from '@app-types/document.types';
import type { PaginationMeta } from '@app-types/customer.types';
import { useAuth } from '@hooks/useAuth';
import { useToast } from '@components/ui/ToastProvider';
import { Button } from '@components/ui/Button';
import { Spinner } from '@components/ui/Spinner';
import { EmptyState } from '@components/ui/EmptyState';
import { ErrorState } from '@components/ui/ErrorState';
import { Pagination } from '@components/ui/Pagination';
import { SearchBar } from '@components/ui/SearchBar';
import { Select } from '@components/ui/Select';
import { ConfirmDialog } from '@components/ui/ConfirmDialog';
import { ApiError } from '@lib/apiClient';

export function DocumentListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1');
  const limit = Number(searchParams.get('limit') ?? '10');
  const search = searchParams.get('search') ?? '';
  const entityType = (searchParams.get('entityType') as DocumentEntityType | null) ?? undefined;
  const documentType = (searchParams.get('documentType') as DocumentType | null) ?? undefined;

  const { role } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isActing, setIsActing] = useState<string | null>(null);

  const canUpload = role === 'ADMIN' || role === 'AGENT';
  const canDelete = role === 'ADMIN' || role === 'AGENT';

  const fetchDocuments = useCallback(async () => {
    setStatus('loading');
    try {
      const result = await listDocuments({
        page,
        limit,
        search: search || undefined,
        entityType,
        documentType,
      });
      setDocuments(result.data);
      setMeta(result.meta);
      setStatus('idle');
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load documents');
      setStatus('error');
    }
  }, [page, limit, search, entityType, documentType]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  function updateParams(partial: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(partial)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.set('page', '1');
    setSearchParams(params);
  }

  function handlePageChange(nextPage: number) {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(nextPage));
    setSearchParams(params);
  }

  async function handleDownload(doc: DocumentRecord) {
    setIsActing(doc.id);
    try {
      await downloadDocument(doc.id, doc.originalFileName);
    } catch (error) {
      showError(error instanceof ApiError ? error.message : 'Failed to download document');
    } finally {
      setIsActing(null);
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteId) return;
    setIsActing(pendingDeleteId);
    try {
      await deleteDocument(pendingDeleteId);
      showSuccess('Document deleted successfully');
      setPendingDeleteId(null);
      await fetchDocuments();
    } catch (error) {
      showError(error instanceof ApiError ? error.message : 'Failed to delete document');
    } finally {
      setIsActing(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink-900)]">
            Documents
          </h1>
          <p className="text-sm text-[var(--color-slate-500)]">
            {role === 'CUSTOMER'
              ? 'Documents attached to your profile, policies, and claims.'
              : 'Manage uploaded identity, policy, and claim documents.'}
          </p>
        </div>
        {canUpload && (
          <Button onClick={() => navigate('/documents/upload')}>+ Upload Document</Button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <SearchBar
          initialValue={search}
          onSearch={(value) => updateParams({ search: value || undefined })}
          placeholder="Search by filename, customer, policy, or claim…"
        />
        <div className="w-40">
          <Select
            label="Entity"
            value={entityType ?? ''}
            onChange={(event) => updateParams({ entityType: event.target.value || undefined })}
          >
            <option value="">All entities</option>
            {DOCUMENT_ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-48">
          <Select
            label="Document type"
            value={documentType ?? ''}
            onChange={(event) => updateParams({ documentType: event.target.value || undefined })}
          >
            <option value="">All types</option>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace('_', ' ')}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
        {status === 'loading' && <Spinner label="Loading documents…" />}

        {status === 'error' && <ErrorState message={errorMessage} onRetry={fetchDocuments} />}

        {status === 'idle' && documents.length === 0 && (
          <EmptyState
            title={
              search || entityType || documentType ? 'No matching documents' : 'No documents yet'
            }
            description={
              search || entityType || documentType
                ? 'Try different search terms or filters.'
                : canUpload
                  ? 'Upload the first document to get started.'
                  : 'Check back once documents have been uploaded.'
            }
            action={
              canUpload && !search && !entityType && !documentType ? (
                <Button size="sm" onClick={() => navigate('/documents/upload')}>
                  + Upload Document
                </Button>
              ) : undefined
            }
          />
        )}

        {status === 'idle' && documents.length > 0 && (
          <>
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--color-surface-muted)] text-xs uppercase tracking-wide text-[var(--color-slate-500)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Filename</th>
                  <th className="px-4 py-3 font-medium">Entity</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Size</th>
                  <th className="px-4 py-3 font-medium">Uploaded</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/documents/${doc.id}`)}
                        className="font-medium text-[var(--color-ink-900)] hover:underline"
                      >
                        {doc.originalFileName}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-slate-600)]">{doc.entityType}</td>
                    <td className="px-4 py-3 text-[var(--color-slate-600)]">
                      {doc.documentType.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-slate-600)]">
                      {formatFileSize(doc.fileSize)}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-slate-600)]">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                          isLoading={isActing === doc.id}
                        >
                          Download
                        </Button>
                        {canDelete && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setPendingDeleteId(doc.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {meta && (
              <Pagination
                meta={meta}
                onPageChange={handlePageChange}
                itemLabel="documents"
                pageSize={limit}
                onPageSizeChange={(size) => updateParams({ limit: String(size) })}
              />
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete this document?"
        description="The document will be removed from lists. Records are retained, not permanently deleted."
        confirmLabel="Delete"
        isLoading={isActing === pendingDeleteId}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
