import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { listClaims } from '@services/claim.service';
import { getPolicyById } from '@services/policy.service';
import type { Claim } from '@app-types/claim.types';
import type { Policy } from '@app-types/policy.types';
import type { PaginationMeta } from '@app-types/customer.types';
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

export function ClaimHistoryPage() {
  const { id: policyId } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1');

  const [policy, setPolicy] = useState<Policy | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const load = useCallback(async () => {
    if (!policyId) return;
    setStatus('loading');
    try {
      const [policyResult, claimsResult] = await Promise.all([
        getPolicyById(policyId),
        listClaims({ page, limit: 10, policyId }),
      ]);
      setPolicy(policyResult);
      setClaims(claimsResult.data);
      setMeta(claimsResult.meta);
      setStatus('idle');
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load claim history');
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

  if (status === 'loading') return <Spinner label="Loading claim history…" />;
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
            Claim History
          </h1>
          {policy && (
            <p className="text-sm text-[var(--color-slate-500)]">Policy {policy.policyNumber}</p>
          )}
        </div>
        <Link to={`/claims/new?policyId=${policyId}`}>
          <Button>+ Register Claim</Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
        {claims.length === 0 ? (
          <EmptyState
            title="No claims filed yet"
            description="Claims filed against this policy will appear here."
            action={
              <Link to={`/claims/new?policyId=${policyId}`}>
                <Button size="sm">+ Register Claim</Button>
              </Link>
            }
          />
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--color-surface-muted)] text-xs uppercase tracking-wide text-[var(--color-slate-500)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Claim #</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Claim Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr key={claim.id} className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-3 font-medium text-[var(--color-ink-900)]">
                      {claim.claimNumber}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-slate-600)]">
                      {formatMoney(claim.claimAmount)}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-slate-600)]">
                      {new Date(claim.claimDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={claim.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/claims/${claim.id}`}>
                        <Button variant="secondary" size="sm">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {meta && <Pagination meta={meta} onPageChange={handlePageChange} itemLabel="claims" />}
          </>
        )}
      </div>
    </div>
  );
}
