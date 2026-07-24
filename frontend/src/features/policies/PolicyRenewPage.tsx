import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPolicyById, renewPolicy } from '@services/policy.service';
import type { Policy } from '@app-types/policy.types';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Spinner } from '@components/ui/Spinner';
import { ErrorState } from '@components/ui/ErrorState';
import { StatusBadge } from '@components/ui/StatusBadge';
import { useToast } from '@components/ui/ToastProvider';
import { ApiError } from '@lib/apiClient';

function addOneYear(dateString: string): string {
  const date = new Date(dateString);
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

export function PolicyRenewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loadStatus, setLoadStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [loadError, setLoadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [premiumAmount, setPremiumAmount] = useState('');
  const [coverageAmount, setCoverageAmount] = useState('');

  useEffect(() => {
    if (!id) return;
    getPolicyById(id)
      .then((result) => {
        setPolicy(result);
        const newStart = result.endDate.slice(0, 10);
        setStartDate(newStart);
        setEndDate(addOneYear(newStart));
        setPremiumAmount(result.premiumAmount);
        setCoverageAmount(result.coverageAmount);
        setLoadStatus('idle');
      })
      .catch((error) => {
        setLoadError(error instanceof ApiError ? error.message : 'Failed to load policy');
        setLoadStatus('error');
      });
  }, [id]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!id) return;
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const renewed = await renewPolicy(id, {
        startDate,
        endDate,
        premiumAmount: premiumAmount ? Number(premiumAmount) : undefined,
        coverageAmount: coverageAmount ? Number(coverageAmount) : undefined,
      });
      showSuccess(`Policy renewed as ${renewed.policyNumber}`);
      navigate(`/policies/${renewed.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        const errors: Record<string, string> = {};
        for (const fieldError of error.fieldErrors) {
          errors[fieldError.path] = fieldError.message;
        }
        setFieldErrors(errors);
      }
      showError(error instanceof ApiError ? error.message : 'Failed to renew policy');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadStatus === 'loading') return <Spinner label="Loading policy…" />;
  if (loadStatus === 'error') return <ErrorState message={loadError} />;
  if (!policy) return null;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink-900)]">
        Renew Policy
      </h1>
      <p className="mb-6 flex items-center gap-2 text-sm text-[var(--color-slate-500)]">
        Renewing{' '}
        <span className="font-medium text-[var(--color-ink-900)]">{policy.policyNumber}</span>
        <StatusBadge status={policy.status} />
      </p>

      <div className="mb-4 rounded-md bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-slate-600)]">
        The current policy period ({new Date(policy.startDate).toLocaleDateString()} –{' '}
        {new Date(policy.endDate).toLocaleDateString()}) will be marked <strong>RENEWED</strong> and
        kept as history. A new policy record is created for the next period below.
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-lg border border-[var(--color-border)] bg-white p-6"
      >
        <Input
          label="New start date"
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          error={fieldErrors.startDate}
          required
        />
        <Input
          label="New end date"
          type="date"
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
          error={fieldErrors.endDate}
          required
        />
        <Input
          label="Premium amount"
          type="number"
          min="0"
          step="0.01"
          value={premiumAmount}
          onChange={(event) => setPremiumAmount(event.target.value)}
          error={fieldErrors.premiumAmount}
        />
        <Input
          label="Coverage amount"
          type="number"
          min="0"
          step="0.01"
          value={coverageAmount}
          onChange={(event) => setCoverageAmount(event.target.value)}
          error={fieldErrors.coverageAmount}
        />

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Confirm Renewal
          </Button>
        </div>
      </form>
    </div>
  );
}
