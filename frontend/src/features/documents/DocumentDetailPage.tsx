import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { downloadDocument, getDocumentById } from '@services/document.service';
import type { DocumentRecord } from '@app-types/document.types';
import { formatFileSize } from '@app-types/document.types';
import { useAuth } from '@hooks/useAuth';
import { useToast } from '@components/ui/ToastProvider';
import { Button } from '@components/ui/Button';
import { Spinner } from '@components/ui/Spinner';
import { ErrorState } from '@components/ui/ErrorState';
import { ApiError } from '@lib/apiClient';

function formatDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const ENTITY_LINK_PREFIX: Record<string, string> = {
  CUSTOMER: '/customers',
  POLICY: '/policies',
  CLAIM: '/claims',
};

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();
  const { showError } = useToast();

  const [documentRecord, setDocumentRecord] = useState<DocumentRecord | null>(null);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const canUpload = role === 'ADMIN' || role === 'AGENT';

  function load() {
    if (!id) return;
    setStatus('loading');
    getDocumentById(id)
      .then((result) => {
        setDocumentRecord(result);
        setStatus('idle');
      })
      .catch((error) => {
        setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load document');
        setStatus('error');
      });
  }

  useEffect(load, [id]);

  async function handleDownload() {
    if (!documentRecord) return;
    setIsDownloading(true);
    try {
      await downloadDocument(documentRecord.id, documentRecord.originalFileName);
    } catch (error) {
      showError(error instanceof ApiError ? error.message : 'Failed to download document');
    } finally {
      setIsDownloading(false);
    }
  }

  if (status === 'loading') return <Spinner label="Loading document…" />;
  if (status === 'error') return <ErrorState message={errorMessage} onRetry={load} />;
  if (!documentRecord) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/documents"
        className="mb-4 inline-block text-sm text-[var(--color-slate-500)] hover:text-[var(--color-ink-900)]"
      >
        ← Back to documents
      </Link>

      <div className="rounded-lg border border-[var(--color-border)] bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="break-all font-[var(--font-display)] text-xl font-semibold text-[var(--color-ink-900)]">
              {documentRecord.originalFileName}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-slate-500)]">
              {documentRecord.documentType.replace('_', ' ')}
            </p>
          </div>
          <Button onClick={handleDownload} isLoading={isDownloading}>
            Download
          </Button>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-[var(--color-border)] pt-6 text-sm">
          <div>
            <dt className="text-[var(--color-slate-500)]">Attached to</dt>
            <dd className="mt-1 font-medium text-[var(--color-ink-900)]">
              {canUpload ? (
                <Link
                  to={`${ENTITY_LINK_PREFIX[documentRecord.entityType]}/${documentRecord.entityId}`}
                  className="hover:underline"
                >
                  {documentRecord.entityType}
                </Link>
              ) : (
                documentRecord.entityType
              )}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--color-slate-500)]">File size</dt>
            <dd className="mt-1 font-medium text-[var(--color-ink-900)]">
              {formatFileSize(documentRecord.fileSize)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--color-slate-500)]">File type</dt>
            <dd className="mt-1 font-medium text-[var(--color-ink-900)]">
              {documentRecord.mimeType}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--color-slate-500)]">Uploaded</dt>
            <dd className="mt-1 font-medium text-[var(--color-ink-900)]">
              {formatDate(documentRecord.uploadedAt)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
