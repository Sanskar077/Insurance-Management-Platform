import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';
import { Spinner } from '@components/ui/Spinner';
import { ErrorState } from '@components/ui/ErrorState';
import { useToast } from '@components/ui/ToastProvider';
import { getClaimById, updateClaim } from '@services/claim.service';
import { CLAIM_TYPES, type ClaimType } from '@app-types/claim.types';
import { ApiError } from '@lib/apiClient';

interface FormState {
  claimType: ClaimType;
  claimAmount: string;
  incidentDate: string;
  description: string;
}

export function ClaimEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [form, setForm] = useState<FormState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loadStatus, setLoadStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [loadError, setLoadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    getClaimById(id)
      .then((claim) => {
        setForm({
          claimType: claim.claimType,
          claimAmount: claim.claimAmount,
          incidentDate: claim.incidentDate.slice(0, 10),
          description: claim.description,
        });
        setLoadStatus('idle');
      })
      .catch((error) => {
        setLoadError(error instanceof ApiError ? error.message : 'Failed to load claim');
        setLoadStatus('error');
      });
  }, [id]);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => (current ? { ...current, [field]: value } : current));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!id || !form) return;
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const updated = await updateClaim(id, {
        claimType: form.claimType,
        claimAmount: Number(form.claimAmount),
        incidentDate: form.incidentDate,
        description: form.description,
      });
      showSuccess('Claim updated successfully');
      navigate(`/claims/${updated.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        const errors: Record<string, string> = {};
        for (const fieldError of error.fieldErrors) {
          errors[fieldError.path] = fieldError.message;
        }
        setFieldErrors(errors);
      }
      showError(error instanceof ApiError ? error.message : 'Failed to update claim');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadStatus === 'loading') return <Spinner label="Loading claim…" />;
  if (loadStatus === 'error') return <ErrorState message={loadError} />;
  if (!form) return null;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink-900)]">
        Edit Claim
      </h1>
      <p className="mb-6 text-sm text-[var(--color-slate-500)]">
        Update claim details. Closed claims cannot be modified.
      </p>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-lg border border-[var(--color-border)] bg-white p-6"
      >
        <Select
          label="Claim type"
          value={form.claimType}
          onChange={(event) => updateField('claimType', event.target.value as ClaimType)}
          required
        >
          {CLAIM_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>

        <Input
          label="Claim amount"
          type="number"
          min="0.01"
          step="0.01"
          value={form.claimAmount}
          onChange={(event) => updateField('claimAmount', event.target.value)}
          error={fieldErrors.claimAmount}
          required
        />
        <Input
          label="Incident date"
          type="date"
          value={form.incidentDate}
          onChange={(event) => updateField('incidentDate', event.target.value)}
          error={fieldErrors.incidentDate}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-sm font-medium text-[var(--color-ink-900)]">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            className="rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-ink-900)] outline-none transition-colors focus:border-[var(--color-ink-700)] focus:ring-2 focus:ring-[var(--color-ink-700)]/15"
            required
          />
          {fieldErrors.description && (
            <p className="text-sm text-[var(--color-danger-600)]">{fieldErrors.description}</p>
          )}
        </div>

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
