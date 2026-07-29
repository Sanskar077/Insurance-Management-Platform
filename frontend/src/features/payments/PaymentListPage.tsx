import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { listPayments } from '@services/premiumPayment.service';
import type { PaymentMethod, PaymentStatus, PremiumPayment } from '@app-types/premiumPayment.types';
import { PAYMENT_METHODS, PAYMENT_STATUSES } from '@app-types/premiumPayment.types';
import type { PaginationMeta } from '@app-types/customer.types';
import { useAuth } from '@hooks/useAuth';
import { Button } from '@components/ui/Button';
import { Spinner } from '@components/ui/Spinner';
import { EmptyState } from '@components/ui/EmptyState';
import { ErrorState } from '@components/ui/ErrorState';
import { Pagination } from '@components/ui/Pagination';
import { SearchBar } from '@components/ui/SearchBar';
import { Select } from '@components/ui/Select';
import { StatusBadge } from '@components/ui/StatusBadge';
import { RangeFilter } from '@components/ui/RangeFilter';
import { ApiError } from '@lib/apiClient';

function formatMoney(value: string): string {
  return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function PaymentListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1');
  const limit = Number(searchParams.get('limit') ?? '10');
  const search = searchParams.get('search') ?? '';
  const paymentStatus = (searchParams.get('paymentStatus') as PaymentStatus | null) ?? undefined;
  const paymentMethod = (searchParams.get('paymentMethod') as PaymentMethod | null) ?? undefined;
  const minAmount = searchParams.get('minAmount') ?? '';
  const maxAmount = searchParams.get('maxAmount') ?? '';

  const { role } = useAuth();
  const navigate = useNavigate();

  const [payments, setPayments] = useState<PremiumPayment[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const canCreate = role === 'ADMIN' || role === 'AGENT';

  const fetchPayments = useCallback(async () => {
    setStatus('loading');
    try {
      const result = await listPayments({
        page,
        limit,
        search: search || undefined,
        paymentStatus,
        paymentMethod,
        minAmount: minAmount ? Number(minAmount) : undefined,
        maxAmount: maxAmount ? Number(maxAmount) : undefined,
      });
      setPayments(result.data);
      setMeta(result.meta);
      setStatus('idle');
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load payments');
      setStatus('error');
    }
  }, [page, limit, search, paymentStatus, paymentMethod, minAmount, maxAmount]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  function updateParams(partial: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(partial)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.set('page', '1');
    setSearchParams(params);
  }

  function handlePageChange(nextPage: number) {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(nextPage));
    setSearchParams(params);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink-900)]">
            Premium Payments
          </h1>
          <p className="text-sm text-[var(--color-slate-500)]">
            {role === 'CUSTOMER'
              ? 'Your premium payment history.'
              : 'Track premium payments across all policies.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/premium-payments/overdue">
            <Button variant="secondary">Overdue Premiums</Button>
          </Link>
          {canCreate && (
            <Button onClick={() => navigate('/premium-payments/new')}>+ Record Payment</Button>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <SearchBar
          initialValue={search}
          onSearch={(value) => updateParams({ search: value || undefined })}
          placeholder="Search by policy number, customer, or reference…"
        />
        <div className="w-40">
          <Select
            label="Status"
            value={paymentStatus ?? ''}
            onChange={(event) => updateParams({ paymentStatus: event.target.value || undefined })}
          >
            <option value="">All statuses</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-44">
          <Select
            label="Method"
            value={paymentMethod ?? ''}
            onChange={(event) => updateParams({ paymentMethod: event.target.value || undefined })}
          >
            <option value="">All methods</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </div>
        <RangeFilter
          label="Amount ($)"
          min={minAmount}
          max={maxAmount}
          onChange={(nextMin, nextMax) =>
            updateParams({ minAmount: nextMin || undefined, maxAmount: nextMax || undefined })
          }
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
        {status === 'loading' && <Spinner label="Loading payments…" />}

        {status === 'error' && <ErrorState message={errorMessage} onRetry={fetchPayments} />}

        {status === 'idle' && payments.length === 0 && (
          <EmptyState
            title={
              search || paymentStatus || paymentMethod ? 'No matching payments' : 'No payments yet'
            }
            description={
              search || paymentStatus || paymentMethod
                ? 'Try different search terms or filters.'
                : canCreate
                  ? 'Record the first premium payment to get started.'
                  : 'Check back once a payment has been recorded.'
            }
            action={
              canCreate && !search && !paymentStatus && !paymentMethod ? (
                <Button size="sm" onClick={() => navigate('/premium-payments/new')}>
                  + Record Payment
                </Button>
              ) : undefined
            }
          />
        )}

        {status === 'idle' && payments.length > 0 && (
          <>
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--color-surface-muted)] text-xs uppercase tracking-wide text-[var(--color-slate-500)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                  <th className="px-4 py-3 font-medium">Payment Date</th>
                  <th className="px-4 py-3 font-medium">Method</th>
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
                      {payment.isOverdue && (
                        <span className="ml-2 text-xs font-medium text-[var(--color-danger-600)]">
                          overdue
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-slate-600)]">
                      {payment.paymentDate
                        ? new Date(payment.paymentDate).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-slate-600)]">
                      {payment.paymentMethod ?? '—'}
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
            {meta && (
              <Pagination
                meta={meta}
                onPageChange={handlePageChange}
                itemLabel="payments"
                pageSize={limit}
                onPageSizeChange={(size) => updateParams({ limit: String(size) })}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
