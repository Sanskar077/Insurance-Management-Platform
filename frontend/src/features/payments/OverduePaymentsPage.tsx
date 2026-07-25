import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listOverduePayments } from '@services/premiumPayment.service';
import type { PremiumPayment } from '@app-types/premiumPayment.types';
import type { PaginationMeta } from '@app-types/customer.types';
import { Button } from '@components/ui/Button';
import { Spinner } from '@components/ui/Spinner';
import { EmptyState } from '@components/ui/EmptyState';
import { ErrorState } from '@components/ui/ErrorState';
import { Pagination } from '@components/ui/Pagination';
import { ApiError } from '@lib/apiClient';

function formatMoney(value: string): string {
  return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function daysOverdue(dueDate: string): number {
  const diffMs = Date.now() - new Date(dueDate).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function OverduePaymentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1');

  const [payments, setPayments] = useState<PremiumPayment[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const result = await listOverduePayments(page, 10);
      setPayments(result.data);
      setMeta(result.meta);
      setStatus('idle');
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Failed to load overdue payments',
      );
      setStatus('error');
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  function handlePageChange(nextPage: number) {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(nextPage));
    setSearchParams(params);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        to="/premium-payments"
        className="mb-4 inline-block text-sm text-[var(--color-slate-500)] hover:text-[var(--color-ink-900)]"
      >
        ← Back to payments
      </Link>

      <div className="mb-6">
        <h1 className="font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink-900)]">
          Overdue Premiums
        </h1>
        <p className="text-sm text-[var(--color-slate-500)]">
          Payments still <strong>PENDING</strong> past their due date, calculated live — not stored.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--color-danger-100)] bg-white">
        {status === 'loading' && <Spinner label="Checking for overdue payments…" />}

        {status === 'error' && <ErrorState message={errorMessage} onRetry={load} />}

        {status === 'idle' && payments.length === 0 && (
          <EmptyState
            title="No overdue premiums"
            description="Everything is up to date. Nice work."
          />
        )}

        {status === 'idle' && payments.length > 0 && (
          <>
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--color-danger-100)]/40 text-xs uppercase tracking-wide text-[var(--color-danger-600)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                  <th className="px-4 py-3 font-medium">Days Overdue</th>
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
                    <td className="px-4 py-3">
                      <span className="font-medium text-[var(--color-danger-600)]">
                        {daysOverdue(payment.dueDate)} days
                      </span>
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
            {meta && <Pagination meta={meta} onPageChange={handlePageChange} />}
          </>
        )}
      </div>
    </div>
  );
}
