import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { listClaims } from '@services/claim.service';
import type { Claim, ClaimStatus, ClaimType } from '@app-types/claim.types';
import { CLAIM_STATUSES, CLAIM_TYPES } from '@app-types/claim.types';
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

export function ClaimListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1');
  const limit = Number(searchParams.get('limit') ?? '10');
  const search = searchParams.get('search') ?? '';
  const status = (searchParams.get('status') as ClaimStatus | null) ?? undefined;
  const claimType = (searchParams.get('claimType') as ClaimType | null) ?? undefined;
  const minAmount = searchParams.get('minAmount') ?? '';
  const maxAmount = searchParams.get('maxAmount') ?? '';

  const { role } = useAuth();
  const navigate = useNavigate();

  const [claims, setClaims] = useState<Claim[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchClaims = useCallback(async () => {
    setLoadStatus('loading');
    try {
      const result = await listClaims({
        page,
        limit,
        search: search || undefined,
        status,
        claimType,
        minAmount: minAmount ? Number(minAmount) : undefined,
        maxAmount: maxAmount ? Number(maxAmount) : undefined,
      });
      setClaims(result.data);
      setMeta(result.meta);
      setLoadStatus('idle');
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load claims');
      setLoadStatus('error');
    }
  }, [page, limit, search, status, claimType, minAmount, maxAmount]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

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
            Claims
          </h1>
          <p className="text-sm text-[var(--color-slate-500)]">
            {role === 'CUSTOMER'
              ? 'Your insurance claims.'
              : 'Review and process insurance claims.'}
          </p>
        </div>
        <Button onClick={() => navigate('/claims/new')}>+ Register Claim</Button>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <SearchBar
          initialValue={search}
          onSearch={(value) => updateParams({ search: value || undefined })}
          placeholder="Search by claim number, policy, or customer…"
        />
        <div className="w-44">
          <Select
            label="Status"
            value={status ?? ''}
            onChange={(event) => updateParams({ status: event.target.value || undefined })}
          >
            <option value="">All statuses</option>
            {CLAIM_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <Select
            label="Type"
            value={claimType ?? ''}
            onChange={(event) => updateParams({ claimType: event.target.value || undefined })}
          >
            <option value="">All types</option>
            {CLAIM_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <RangeFilter
          label="Claim amount ($)"
          min={minAmount}
          max={maxAmount}
          onChange={(nextMin, nextMax) =>
            updateParams({ minAmount: nextMin || undefined, maxAmount: nextMax || undefined })
          }
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
        {loadStatus === 'loading' && <Spinner label="Loading claims…" />}

        {loadStatus === 'error' && <ErrorState message={errorMessage} onRetry={fetchClaims} />}

        {loadStatus === 'idle' && claims.length === 0 && (
          <EmptyState
            title={search || status || claimType ? 'No matching claims' : 'No claims yet'}
            description={
              search || status || claimType
                ? 'Try different search terms or filters.'
                : 'Register a claim to get started.'
            }
            action={
              !search && !status && !claimType ? (
                <Button size="sm" onClick={() => navigate('/claims/new')}>
                  + Register Claim
                </Button>
              ) : undefined
            }
          />
        )}

        {loadStatus === 'idle' && claims.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-[var(--color-surface-muted)] text-xs uppercase tracking-wide text-[var(--color-slate-500)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Claim #</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Claim Amount</th>
                    <th className="px-4 py-3 font-medium">Claim Date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim) => (
                    <tr key={claim.id} className="border-t border-[var(--color-border)]">
                      <td className="px-4 py-3">
                        <Link
                          to={`/claims/${claim.id}`}
                          className="font-medium text-[var(--color-ink-900)] hover:underline"
                        >
                          {claim.claimNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-slate-600)]">{claim.claimType}</td>
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
            </div>
            {meta && (
              <Pagination
                meta={meta}
                onPageChange={handlePageChange}
                itemLabel="claims"
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
