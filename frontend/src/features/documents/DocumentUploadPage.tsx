import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';
import { ProgressBar } from '@components/ui/ProgressBar';
import { useToast } from '@components/ui/ToastProvider';
import { uploadDocument } from '@services/document.service';
import {
  ALLOWED_MIME_TYPES,
  DOCUMENT_ENTITY_TYPES,
  DOCUMENT_TYPES,
  MAX_FILE_SIZE_BYTES,
  formatFileSize,
  type DocumentEntityType,
  type DocumentType,
} from '@app-types/document.types';
import { ApiError } from '@lib/apiClient';

export function DocumentUploadPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [entityType, setEntityType] = useState<DocumentEntityType>(
    (searchParams.get('entityType') as DocumentEntityType) || 'CUSTOMER',
  );
  const [entityId, setEntityId] = useState(searchParams.get('entityId') ?? '');
  const [documentType, setDocumentType] = useState<DocumentType>('OTHER');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [entityIdError, setEntityIdError] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const prefillEntityId = searchParams.get('entityId');
    if (prefillEntityId) setEntityId(prefillEntityId);
    const prefillEntityType = searchParams.get('entityType') as DocumentEntityType | null;
    if (prefillEntityType) setEntityType(prefillEntityType);
  }, [searchParams]);

  function validateFile(candidate: File): string | null {
    if (candidate.size > MAX_FILE_SIZE_BYTES) {
      return `File exceeds the 10 MB limit (${formatFileSize(candidate.size)})`;
    }
    if (!ALLOWED_MIME_TYPES.includes(candidate.type)) {
      return 'Only PDF, JPG, JPEG, and PNG files are allowed';
    }
    return null;
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) {
      setFile(null);
      return;
    }
    const error = validateFile(selected);
    if (error) {
      setFileError(error);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setFileError('');
    setFile(selected);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setEntityIdError('');

    if (!entityId.trim()) {
      setEntityIdError('An entity id is required');
      return;
    }
    if (!file) {
      setFileError('Select a file to upload');
      return;
    }

    setIsSubmitting(true);
    setProgress(0);
    try {
      const uploaded = await uploadDocument(
        file,
        { entityType, entityId: entityId.trim(), documentType },
        (percent) => setProgress(percent),
      );
      showSuccess(`${uploaded.originalFileName} uploaded successfully`);
      navigate(`/documents/${uploaded.id}`);
    } catch (error) {
      showError(error instanceof ApiError ? error.message : 'Failed to upload document');
    } finally {
      setIsSubmitting(false);
      setProgress(null);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink-900)]">
        Upload Document
      </h1>
      <p className="mb-6 text-sm text-[var(--color-slate-500)]">
        Attach a document to a customer, policy, or claim. PDF, JPG, or PNG, up to 10 MB.
      </p>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-lg border border-[var(--color-border)] bg-white p-6"
      >
        <Select
          label="Attach to"
          value={entityType}
          onChange={(event) => setEntityType(event.target.value as DocumentEntityType)}
        >
          {DOCUMENT_ENTITY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>

        <Input
          label={`${entityType.charAt(0)}${entityType.slice(1).toLowerCase()} ID`}
          value={entityId}
          onChange={(event) => setEntityId(event.target.value)}
          error={entityIdError}
          placeholder="Paste the UUID, or open this form from the record's detail page"
          required
        />

        <Select
          label="Document type"
          value={documentType}
          onChange={(event) => setDocumentType(event.target.value as DocumentType)}
        >
          {DOCUMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.replace('_', ' ')}
            </option>
          ))}
        </Select>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="file" className="text-sm font-medium text-[var(--color-ink-900)]">
            File
          </label>
          <input
            id="file"
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-ink-900)] file:mr-3 file:rounded file:border-0 file:bg-[var(--color-surface-muted)] file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
          {file && !fileError && (
            <p className="text-xs text-[var(--color-slate-500)]">
              {file.name} · {formatFileSize(file.size)}
            </p>
          )}
          {fileError && <p className="text-sm text-[var(--color-danger-600)]">{fileError}</p>}
        </div>

        {progress !== null && <ProgressBar percent={progress} />}

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Upload
          </Button>
        </div>
      </form>
    </div>
  );
}
