import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';
import { Spinner } from '@components/ui/Spinner';
import { ErrorState } from '@components/ui/ErrorState';
import { useToast } from '@components/ui/ToastProvider';
import { createPolicy, getPolicyById, updatePolicy } from '@services/policy.service';
import { getCustomerById } from '@services/customer.service';
import { POLICY_TYPES, type PolicyType } from '@app-types/policy.types';
import { CustomerPicker } from '@features/policies/CustomerPicker';
import { ApiError } from '@lib/apiClient';

interface FormState {
  customerId: string;
  customerLabel: string;
  policyType: PolicyType;
  premiumAmount: string;
  coverageAmount: string;
  startDate: string;
  endDate: string;
  description: string;
}

const EMPTY_FORM: FormState = {
  customerId: '',
  customerLabel: '',
  policyType: 'HEALTH',
  premiumAmount: '',
  coverageAmount: '',
  startDate: '',
  endDate: '',
  description: '',
};

export function PolicyFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'error'>(
    isEditMode ? 'loading' : 'idle',
  );
  const [loadError, setLoadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
      setLoadStatus('loading');
      getPolicyById(id)
        .then(async (policy) => {
          const customer = await getCustomerById(policy.customerId).catch(() => null);
          setForm({
            customerId: policy.customerId,
            customerLabel: customer?.fullName ?? policy.customerId,
            policyType: policy.policyType,
            premiumAmount: policy.premiumAmount,
            coverageAmount: policy.coverageAmount,
            startDate: policy.startDate.slice(0, 10),
            endDate: policy.endDate.slice(0, 10),
            description: policy.description ?? '',
          });
          setLoadStatus('idle');
        })
        .catch((error) => {
          setLoadError(error instanceof ApiError ? error.message : 'Failed to load policy');
          setLoadStatus('error');
        });
      return;
    }

    const prefillCustomerId = searchParams.get('customerId');
    if (prefillCustomerId) {
      getCustomerById(prefillCustomerId)
        .then((customer) => {
          setForm((current) => ({
            ...current,
            customerId: customer.id,
            customerLabel: customer.fullName,
          }));
        })
        .catch(() => {
          /* ignore — user can still search manually */
        });
    }
  }, [id, isEditMode, searchParams]);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldErrors({});

    if (!isEditMode && !form.customerId) {
      setFieldErrors({ customerId: 'Select a customer' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && id) {
        const updated = await updatePolicy(id, {
          policyType: form.policyType,
          premiumAmount: Number(form.premiumAmount),
          coverageAmount: Number(form.coverageAmount),
          startDate: form.startDate,
          endDate: form.endDate,
          description: form.description || undefined,
        });
        showSuccess('Policy updated successfully');
        navigate(`/policies/${updated.id}`);
      } else {
        const created = await createPolicy({
          customerId: form.customerId,
          policyType: form.policyType,
          premiumAmount: Number(form.premiumAmount),
          coverageAmount: Number(form.coverageAmount),
          startDate: form.startDate,
          endDate: form.endDate,
          description: form.description || undefined,
        });
        showSuccess(`Policy ${created.policyNumber} created successfully`);
        navigate(`/policies/${created.id}`);
      }
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        const errors: Record<string, string> = {};
        for (const fieldError of error.fieldErrors) {
          errors[fieldError.path] = fieldError.message;
        }
        setFieldErrors(errors);
      }
      showError(error instanceof ApiError ? error.message : 'Failed to save policy');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadStatus === 'loading') return <Spinner label="Loading policy…" />;
  if (loadStatus === 'error') return <ErrorState message={loadError} />;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink-900)]">
        {isEditMode ? 'Edit Policy' : 'New Policy'}
      </h1>
      <p className="mb-6 text-sm text-[var(--color-slate-500)]">
        {isEditMode
          ? 'Update this policy\u2019s coverage and terms.'
          : 'Issue a new policy for an existing customer.'}
      </p>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-lg border border-[var(--color-border)] bg-white p-6"
      >
        {!isEditMode && (
          <CustomerPicker
            value={form.customerId}
            selectedLabel={form.customerLabel}
            onChange={(customerId, label) => {
              updateField('customerId', customerId);
              updateField('customerLabel', label);
            }}
            error={fieldErrors.customerId}
          />
        )}

        <Select
          label="Policy type"
          value={form.policyType}
          onChange={(event) => updateField('policyType', event.target.value as PolicyType)}
          required
        >
          {POLICY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>

        <Input
          label="Premium amount"
          type="number"
          min="0"
          step="0.01"
          value={form.premiumAmount}
          onChange={(event) => updateField('premiumAmount', event.target.value)}
          error={fieldErrors.premiumAmount}
          required
        />
        <Input
          label="Coverage amount"
          type="number"
          min="0"
          step="0.01"
          value={form.coverageAmount}
          onChange={(event) => updateField('coverageAmount', event.target.value)}
          error={fieldErrors.coverageAmount}
          required
        />
        <Input
          label="Start date"
          type="date"
          value={form.startDate}
          onChange={(event) => updateField('startDate', event.target.value)}
          error={fieldErrors.startDate}
          required
        />
        <Input
          label="End date"
          type="date"
          value={form.endDate}
          onChange={(event) => updateField('endDate', event.target.value)}
          error={fieldErrors.endDate}
          required
        />
        <Input
          label="Description (optional)"
          value={form.description}
          onChange={(event) => updateField('description', event.target.value)}
          error={fieldErrors.description}
        />

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditMode ? 'Save changes' : 'Create policy'}
          </Button>
        </div>
      </form>
    </div>
  );
}
