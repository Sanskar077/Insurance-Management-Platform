import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';
import { useToast } from '@components/ui/ToastProvider';
import { createPayment } from '@services/premiumPayment.service';
import { getPolicyById } from '@services/policy.service';
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  type PaymentMethod,
  type PaymentStatus,
} from '@app-types/premiumPayment.types';
import { ApiError } from '@lib/apiClient';

interface FormState {
  policyId: string;
  policyLabel: string;
  amount: string;
  dueDate: string;
  paymentDate: string;
  paymentMethod: PaymentMethod | '';
  transactionReference: string;
  paymentStatus: PaymentStatus;
  remarks: string;
}

const EMPTY_FORM: FormState = {
  policyId: '',
  policyLabel: '',
  amount: '',
  dueDate: '',
  paymentDate: '',
  paymentMethod: '',
  transactionReference: '',
  paymentStatus: 'PENDING',
  remarks: '',
};

export function PaymentFormPage() {
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
      const created = await createPayment({
        policyId: form.policyId,
        amount: Number(form.amount),
        dueDate: form.dueDate,
        paymentDate: form.paymentDate || undefined,
        paymentMethod: form.paymentMethod || undefined,
        transactionReference: form.transactionReference || undefined,
        paymentStatus: form.paymentStatus,
        remarks: form.remarks || undefined,
      });
      showSuccess('Payment recorded successfully');
      navigate(`/premium-payments/${created.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        const errors: Record<string, string> = {};
        for (const fieldError of error.fieldErrors) {
          errors[fieldError.path] = fieldError.message;
        }
        setFieldErrors(errors);
      }
      showError(error instanceof ApiError ? error.message : 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink-900)]">
        Record Payment
      </h1>
      <p className="mb-6 text-sm text-[var(--color-slate-500)]">
        Record a premium payment for an existing policy.
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

        <Input
          label="Amount"
          type="number"
          min="0.01"
          step="0.01"
          value={form.amount}
          onChange={(event) => updateField('amount', event.target.value)}
          error={fieldErrors.amount}
          required
        />
        <Input
          label="Due date"
          type="date"
          value={form.dueDate}
          onChange={(event) => updateField('dueDate', event.target.value)}
          error={fieldErrors.dueDate}
          required
        />

        <Select
          label="Status"
          value={form.paymentStatus}
          onChange={(event) => updateField('paymentStatus', event.target.value as PaymentStatus)}
        >
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>

        {form.paymentStatus === 'PAID' && (
          <Input
            label="Payment date"
            type="date"
            value={form.paymentDate}
            onChange={(event) => updateField('paymentDate', event.target.value)}
            error={fieldErrors.paymentDate}
            required
          />
        )}

        <Select
          label="Payment method (optional)"
          value={form.paymentMethod}
          onChange={(event) => updateField('paymentMethod', event.target.value as PaymentMethod)}
        >
          <option value="">Not specified</option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>

        <Input
          label="Transaction reference (optional)"
          value={form.transactionReference}
          onChange={(event) => updateField('transactionReference', event.target.value)}
          error={fieldErrors.transactionReference}
        />
        <Input
          label="Remarks (optional)"
          value={form.remarks}
          onChange={(event) => updateField('remarks', event.target.value)}
          error={fieldErrors.remarks}
        />

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Record payment
          </Button>
        </div>
      </form>
    </div>
  );
}
