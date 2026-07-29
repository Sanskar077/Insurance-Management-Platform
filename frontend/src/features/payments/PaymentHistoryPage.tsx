import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { listPaymentsForPolicy } from '@services/premiumPayment.service';
import { getPolicyById } from '@services/policy.service';
import type { PremiumPayment } from '@app-types/premiumPayment.types';
import type { Policy } from '@app-types/policy.types';
import type { PaginationMeta } from '@app-types/customer.types';
import { useAuth } from '@hooks/useAuth';
import { Button } from '@components/ui/Button';
import { Spinner } from '@components/ui/Spinner';
import { EmptyState } from '@components/ui/EmptyState';
import { ErrorState } from '@components/ui/ErrorState';
import { Pagination } from '@components/ui/Pagination';
import { StatusBadge } from '@components/ui/StatusBadge';
import { ApiError } from '@lib/apiClient';

function formatMoney(value: string): string {
  return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function PaymentHistoryPage() {
  const { id: policyId } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1');
  const { role } = useAuth();

  const [policy, setPolicy] = useState<Policy | null>(null);
  const [payments, setPayments] = useState<PremiumPayment[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const canRecordPayment = role === 'ADMIN' || role === 'AGENT';

  const load = useCallback(async () => {
    if (!policyId) return;
    setStatus('loading');
    try {
      const [policyResult, paymentsResult] = await Promise.all([
        getPolicyById(policyId),
        listPaymentsForPolicy(policyId, page, 10),
      ]);
      setPolicy(policyResult);
      setPayments(paymentsResult.data);
      setMeta(paymentsResult.meta);
      setStatus('idle');
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load payment history');
      setStatus('error');
    }
  }, [policyId, page]);

  useEffect(() => {
    load();
  }, [load]);

  function handlePageChange(nextPage: number) {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(nextPage));
    setSearchParams(params);
  }

  if (status === 'loading') return <Spinner label="Loading payment history…" />;
  if (status === 'error') return <ErrorState message={errorMessage} onRetry={load} />;

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to={`/policies/${policyId}`}
        className="mb-4 inline-block text-sm text-[var(--color-slate-500)] hover:text-[var(--color-ink-900)]"
      >
        ← Back to policy
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink-900)]">
            Payment History
          </h1>
          {policy && (
            <p className="text-sm text-[var(--color-slate-500)]">Policy {policy.policyNumber}</p>
          )}
        </div>
        {canRecordPayment && (
          <Link to={`/premium-payments/new?policyId=${policyId}`}>
            <Button>+ Record Payment</Button>
          </Link>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
        {payments.length === 0 ? (
          <EmptyState
            title="No payments recorded yet"
            description="Premium payments for this policy will appear here once recorded."
            action={
              canRecordPayment ? (
                <Link to={`/premium-payments/new?policyId=${policyId}`}>
                  <Button size="sm">+ Record Payment</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-[var(--color-surface-muted)] text-xs uppercase tracking-wide text-[var(--color-slate-500)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Due Date</th>
                    <th className="px-4 py-3 font-medium">Payment Date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-t border-[var(--color-border)]">
                      <td className="px-4 py-3 font-medium text-[var(--color-ink-900)]">
                        {formatMoney(payment.amount)}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-slate-600)]">
                        {new Date(payment.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-slate-600)]">
                        {payment.paymentDate
                          ? new Date(payment.paymentDate).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={payment.paymentStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/premium-payments/${payment.id}`}>
                          <Button variant="secondary" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {meta && (
              <Pagination meta={meta} onPageChange={handlePageChange} itemLabel="payments" />
            )}
          </>
        )}
      </div>
    </div>
  );
}
