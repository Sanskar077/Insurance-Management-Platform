import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';
import { useToast } from '@components/ui/ToastProvider';
import { createClaim } from '@services/claim.service';
import { getPolicyById } from '@services/policy.service';
import { CLAIM_TYPES, type ClaimType } from '@app-types/claim.types';
import { ApiError } from '@lib/apiClient';

interface FormState {
  policyId: string;
  policyLabel: string;
  claimType: ClaimType;
  claimAmount: string;
  incidentDate: string;
  description: string;
}

const EMPTY_FORM: FormState = {
  policyId: '',
  policyLabel: '',
  claimType: 'VEHICLE',
  claimAmount: '',
  incidentDate: '',
  description: '',
};

export function ClaimFormPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const prefillPolicyId = searchParams.get('policyId');
    if (prefillPolicyId) {
      getPolicyById(prefillPolicyId)
        .then((policy) => {
          setForm((current) => ({
            ...current,
            policyId: policy.id,
            policyLabel: policy.policyNumber,
            claimType: policy.policyType,
          }));
        })
        .catch(() => {
          /* ignore — user can retry from the policy page */
        });
    }
  }, [searchParams]);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldErrors({});

    if (!form.policyId) {
      setFieldErrors({ policyId: 'A valid policy id is required' });
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createClaim({
        policyId: form.policyId,
        claimType: form.claimType,
        claimAmount: Number(form.claimAmount),
        incidentDate: form.incidentDate,
        description: form.description,
      });
      showSuccess(`Claim ${created.claimNumber} submitted successfully`);
      navigate(`/claims/${created.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        const errors: Record<string, string> = {};
        for (const fieldError of error.fieldErrors) {
          errors[fieldError.path] = fieldError.message;
        }
        setFieldErrors(errors);
      }
      showError(error instanceof ApiError ? error.message : 'Failed to submit claim');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink-900)]">
        Register Claim
      </h1>
      <p className="mb-6 text-sm text-[var(--color-slate-500)]">
        Submit a new insurance claim against an existing policy.
      </p>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-lg border border-[var(--color-border)] bg-white p-6"
      >
        <Input
          label="Policy ID"
          value={form.policyId}
          onChange={(event) => updateField('policyId', event.target.value)}
          error={fieldErrors.policyId}
          placeholder="Paste the policy's UUID, or open this form from a policy's detail page"
          required
        />
        {form.policyLabel && (
          <p className="-mt-2 text-xs text-[var(--color-slate-500)]">
            Policy:{' '}
            <span className="font-medium text-[var(--color-ink-900)]">{form.policyLabel}</span>
          </p>
        )}

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
            placeholder="Describe what happened (at least 10 characters)…"
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
            Submit claim
          </Button>
        </div>
      </form>
    </div>
  );
}
