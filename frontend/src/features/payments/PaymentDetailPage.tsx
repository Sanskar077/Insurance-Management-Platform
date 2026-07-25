import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPaymentById, updatePayment } from '@services/premiumPayment.service';
import type { PremiumPayment, PaymentStatus } from '@app-types/premiumPayment.types';
import { PAYMENT_STATUSES } from '@app-types/premiumPayment.types';
import { useAuth } from '@hooks/useAuth';
import { useToast } from '@components/ui/ToastProvider';
import { Button } from '@components/ui/Button';
import { Select } from '@components/ui/Select';
import { Spinner } from '@components/ui/Spinner';
import { ErrorState } from '@components/ui/ErrorState';
import { StatusBadge } from '@components/ui/StatusBadge';
import { ApiError } from '@lib/apiClient';

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatMoney(value: string): string {
  return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();
  const { showSuccess, showError } = useToast();

  const [payment, setPayment] = useState<PremiumPayment | null>(null);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [newStatus, setNewStatus] = useState<PaymentStatus>('PENDING');
  const [isUpdating, setIsUpdating] = useState(false);

  const canUpdateStatus = role === 'ADMIN' || role === 'AGENT';

  function load() {
    if (!id) return;
    setStatus('loading');
    getPaymentById(id)
      .then((result) => {
        setPayment(result);
        setNewStatus(result.paymentStatus);
        setStatus('idle');
      })
      .catch((error) => {
        setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load payment');
        setStatus('error');
      });
  }

  useEffect(load, [id]);

  async function handleStatusUpdate() {
    if (!id || !payment || newStatus === payment.paymentStatus) return;
    setIsUpdating(true);
    try {
      const updated = await updatePayment(id, { paymentStatus: newStatus });
      setPayment(updated);
      showSuccess('Payment status updated');
    } catch (error) {
      showError(error instanceof ApiError ? error.message : 'Failed to update payment status');
    } finally {
      setIsUpdating(false);
    }
  }

  if (status === 'loading') return <Spinner label="Loading payment…" />;
  if (status === 'error') return <ErrorState message={errorMessage} onRetry={load} />;
  if (!payment) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/premium-payments"
        className="mb-4 inline-block text-sm text-[var(--color-slate-500)] hover:text-[var(--color-ink-900)]"
      >
        ← Back to payments
      </Link>

      <div className="rounded-lg border border-[var(--color-border)] bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-[var(--font-display)] text-xl font-semibold text-[var(--color-ink-900)]">
              {formatMoney(payment.amount)}
            </h1>
            <Link
              to={`/policies/${payment.policyId}`}
              className="mt-1 inline-block text-sm text-[var(--color-slate-500)] hover:underline"
            >
              View policy
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={payment.paymentStatus} />
            {payment.isOverdue && <StatusBadge status="OVERDUE" />}
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-[var(--color-border)] pt-6 text-sm">
          <div>
            <dt className="text-[var(--color-slate-500)]">Due date</dt>
            <dd className="mt-1 font-medium text-[var(--color-ink-900)]">
              {formatDate(payment.dueDate)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--color-slate-500)]">Payment date</dt>
            <dd className="mt-1 font-medium text-[var(--color-ink-900)]">
              {formatDate(payment.paymentDate)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--color-slate-500)]">Method</dt>
            <dd className="mt-1 font-medium text-[var(--color-ink-900)]">
              {payment.paymentMethod ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--color-slate-500)]">Transaction reference</dt>
            <dd className="mt-1 font-medium text-[var(--color-ink-900)]">
              {payment.transactionReference ?? '—'}
            </dd>
          </div>
          {payment.remarks && (
            <div className="col-span-2">
              <dt className="text-[var(--color-slate-500)]">Remarks</dt>
              <dd className="mt-1 font-medium text-[var(--color-ink-900)]">{payment.remarks}</dd>
            </div>
          )}
        </dl>

        {canUpdateStatus && (
          <div className="mt-6 flex items-end gap-3 border-t border-[var(--color-border)] pt-6">
            <div className="w-48">
              <Select
                label="Update status"
                value={newStatus}
                onChange={(event) => setNewStatus(event.target.value as PaymentStatus)}
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              onClick={handleStatusUpdate}
              isLoading={isUpdating}
              disabled={newStatus === payment.paymentStatus}
            >
              Save
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
