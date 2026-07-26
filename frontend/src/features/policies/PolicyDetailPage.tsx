import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getPolicyById } from '@services/policy.service';
import type { Policy } from '@app-types/policy.types';
import { useAuth } from '@hooks/useAuth';
import { Button } from '@components/ui/Button';
import { Spinner } from '@components/ui/Spinner';
import { ErrorState } from '@components/ui/ErrorState';
import { StatusBadge } from '@components/ui/StatusBadge';
import { ApiError } from '@lib/apiClient';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatMoney(value: string): string {
  return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function PolicyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();

  const [policy, setPolicy] = useState<Policy | null>(null);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const canManage = role === 'ADMIN' || role === 'AGENT';

  function load() {
    if (!id) return;
    setStatus('loading');
    getPolicyById(id)
      .then((result) => {
        setPolicy(result);
        setStatus('idle');
      })
      .catch((error) => {
        setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load policy');
        setStatus('error');
      });
  }

  useEffect(load, [id]);

  if (status === 'loading') return <Spinner label="Loading policy…" />;
  if (status === 'error') return <ErrorState message={errorMessage} onRetry={load} />;
  if (!policy) return null;

  const canRenew = canManage && policy.status !== 'CANCELLED' && policy.status !== 'RENEWED';

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/policies"
        className="mb-4 inline-block text-sm text-[var(--color-slate-500)] hover:text-[var(--color-ink-900)]"
      >
        ← Back to policies
      </Link>

      <div className="rounded-lg border border-[var(--color-border)] bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-[var(--font-display)] text-xl font-semibold text-[var(--color-ink-900)]">
              {policy.policyNumber}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-slate-500)]">{policy.policyType}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={policy.status} />
            {canManage && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/policies/${policy.id}/edit`)}
              >
                Edit
              </Button>
            )}
          </div>
        </div>

        {policy.isExpired && policy.status === 'ACTIVE' && (
          <p className="mt-3 rounded-md bg-[var(--color-warning-100)] px-3 py-2 text-sm text-[var(--color-warning-600)]">
            This policy's end date has passed and it is now overdue for renewal or cancellation.
          </p>
        )}

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-[var(--color-border)] pt-6 text-sm">
          <div>
            <dt className="text-[var(--color-slate-500)]">Premium amount</dt>
            <dd className="mt-1 font-medium text-[var(--color-ink-900)]">
              {formatMoney(policy.premiumAmount)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--color-slate-500)]">Coverage amount</dt>
            <dd className="mt-1 font-medium text-[var(--color-ink-900)]">
              {formatMoney(policy.coverageAmount)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--color-slate-500)]">Start date</dt>
            <dd className="mt-1 font-medium text-[var(--color-ink-900)]">
              {formatDate(policy.startDate)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--color-slate-500)]">End date</dt>
            <dd className="mt-1 font-medium text-[var(--color-ink-900)]">
              {formatDate(policy.endDate)}
            </dd>
          </div>
          {policy.description && (
            <div className="col-span-2">
              <dt className="text-[var(--color-slate-500)]">Description</dt>
              <dd className="mt-1 font-medium text-[var(--color-ink-900)]">{policy.description}</dd>
            </div>
          )}
          {policy.renewedFromId && (
            <div className="col-span-2">
              <dt className="text-[var(--color-slate-500)]">Renewed from</dt>
              <dd className="mt-1">
                <Link
                  to={`/policies/${policy.renewedFromId}`}
                  className="font-medium text-[var(--color-ink-900)] hover:underline"
                >
                  View previous policy period
                </Link>
              </dd>
            </div>
          )}
        </dl>

        {canRenew && (
          <div className="mt-6 flex justify-end border-t border-[var(--color-border)] pt-6">
            <Button onClick={() => navigate(`/policies/${policy.id}/renew`)}>Renew Policy</Button>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-white p-6">
        <div>
          <p className="text-sm font-medium text-[var(--color-ink-900)]">Payment History</p>
          <p className="mt-1 text-sm text-[var(--color-slate-500)]">
            View all premium payments recorded for this policy.
          </p>
        </div>
        <Link to={`/policies/${policy.id}/payments`}>
          <Button variant="secondary" size="sm">
            View Payments
          </Button>
        </Link>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-white p-6">
        <div>
          <p className="text-sm font-medium text-[var(--color-ink-900)]">Claim History</p>
          <p className="mt-1 text-sm text-[var(--color-slate-500)]">
            View all claims filed against this policy.
          </p>
        </div>
        <Link to={`/policies/${policy.id}/claims`}>
          <Button variant="secondary" size="sm">
            View Claims
          </Button>
        </Link>
      </div>
    </div>
  );
}
