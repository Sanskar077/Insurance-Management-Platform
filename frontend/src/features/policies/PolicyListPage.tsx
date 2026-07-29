import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { listPolicies, cancelPolicy, deletePolicy } from '@services/policy.service';
import type { Policy, PolicyStatus, PolicyType } from '@app-types/policy.types';
import { POLICY_STATUSES, POLICY_TYPES } from '@app-types/policy.types';
import type { PaginationMeta } from '@app-types/customer.types';
import { useAuth } from '@hooks/useAuth';
import { useToast } from '@components/ui/ToastProvider';
import { Button } from '@components/ui/Button';
import { Spinner } from '@components/ui/Spinner';
import { EmptyState } from '@components/ui/EmptyState';
import { ErrorState } from '@components/ui/ErrorState';
import { Pagination } from '@components/ui/Pagination';
import { SearchBar } from '@components/ui/SearchBar';
import { Select } from '@components/ui/Select';
import { StatusBadge } from '@components/ui/StatusBadge';
import { ConfirmDialog } from '@components/ui/ConfirmDialog';
import { RangeFilter } from '@components/ui/RangeFilter';
import { ApiError } from '@lib/apiClient';

function formatMoney(value: string): string {
  return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function PolicyListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1');
  const limit = Number(searchParams.get('limit') ?? '10');
  const search = searchParams.get('search') ?? '';
  const status = (searchParams.get('status') as PolicyStatus | null) ?? undefined;
  const policyType = (searchParams.get('policyType') as PolicyType | null) ?? undefined;
  const minPremium = searchParams.get('minPremium') ?? '';
  const maxPremium = searchParams.get('maxPremium') ?? '';

  const { role } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);

  const canCreate = role === 'ADMIN' || role === 'AGENT';
  const canCancel = role === 'ADMIN' || role === 'AGENT';
  const canDelete = role === 'ADMIN';

  const fetchPolicies = useCallback(async () => {
    setLoadStatus('loading');
    try {
      const result = await listPolicies({
        page,
        limit,
        search: search || undefined,
        status,
        policyType,
        minPremium: minPremium ? Number(minPremium) : undefined,
        maxPremium: maxPremium ? Number(maxPremium) : undefined,
      });
      setPolicies(result.data);
      setMeta(result.meta);
      setLoadStatus('idle');
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load policies');
      setLoadStatus('error');
    }
  }, [page, limit, search, status, policyType, minPremium, maxPremium]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

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

  async function handleConfirmCancel() {
    if (!pendingCancelId) return;
    setIsActing(true);
    try {
      await cancelPolicy(pendingCancelId);
      showSuccess('Policy cancelled');
      setPendingCancelId(null);
      await fetchPolicies();
    } catch (error) {
      showError(error instanceof ApiError ? error.message : 'Failed to cancel policy');
    } finally {
      setIsActing(false);
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteId) return;
    setIsActing(true);
    try {
      await deletePolicy(pendingDeleteId);
      showSuccess('Policy deleted');
      setPendingDeleteId(null);
      await fetchPolicies();
    } catch (error) {
      showError(error instanceof ApiError ? error.message : 'Failed to delete policy');
    } finally {
      setIsActing(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink-900)]">
            Policies
          </h1>
          <p className="text-sm text-[var(--color-slate-500)]">
            {role === 'CUSTOMER'
              ? 'Your insurance policies.'
              : 'Manage insurance policies across all customers.'}
          </p>
        </div>
        {canCreate && <Button onClick={() => navigate('/policies/new')}>+ New Policy</Button>}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <SearchBar
          initialValue={search}
          onSearch={(value) => updateParams({ search: value || undefined })}
          placeholder="Search by policy number, customer, or type…"
        />
        <div className="w-40">
          <Select
            label="Status"
            value={status ?? ''}
            onChange={(event) => updateParams({ status: event.target.value || undefined })}
          >
            <option value="">All statuses</option>
            {POLICY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <Select
            label="Type"
            value={policyType ?? ''}
            onChange={(event) => updateParams({ policyType: event.target.value || undefined })}
          >
            <option value="">All types</option>
            {POLICY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <RangeFilter
          label="Premium ($)"
          min={minPremium}
          max={maxPremium}
          onChange={(nextMin, nextMax) =>
            updateParams({ minPremium: nextMin || undefined, maxPremium: nextMax || undefined })
          }
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
        {loadStatus === 'loading' && <Spinner label="Loading policies…" />}

        {loadStatus === 'error' && <ErrorState message={errorMessage} onRetry={fetchPolicies} />}

        {loadStatus === 'idle' && policies.length === 0 && (
          <EmptyState
            title={search || status || policyType ? 'No matching policies' : 'No policies yet'}
            description={
              search || status || policyType
                ? 'Try different search terms or filters.'
                : canCreate
                  ? 'Get started by creating the first policy.'
                  : 'Check back once a policy has been issued.'
            }
            action={
              canCreate && !search && !status && !policyType ? (
                <Button size="sm" onClick={() => navigate('/policies/new')}>
                  + New Policy
                </Button>
              ) : undefined
            }
          />
        )}

        {loadStatus === 'idle' && policies.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-[var(--color-surface-muted)] text-xs uppercase tracking-wide text-[var(--color-slate-500)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Policy #</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Premium</th>
                    <th className="px-4 py-3 font-medium">Coverage</th>
                    <th className="px-4 py-3 font-medium">End Date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((policy) => (
                    <tr key={policy.id} className="border-t border-[var(--color-border)]">
                      <td className="px-4 py-3">
                        <Link
                          to={`/policies/${policy.id}`}
                          className="font-medium text-[var(--color-ink-900)] hover:underline"
                        >
                          {policy.policyNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-slate-600)]">
                        {policy.policyType}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-slate-600)]">
                        {formatMoney(policy.premiumAmount)}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-slate-600)]">
                        {formatMoney(policy.coverageAmount)}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-slate-600)]">
                        {new Date(policy.endDate).toLocaleDateString()}
                        {policy.isExpired && policy.status === 'ACTIVE' && (
                          <span className="ml-2 text-xs font-medium text-[var(--color-warning-600)]">
                            overdue
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={policy.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link to={`/policies/${policy.id}`}>
                            <Button variant="secondary" size="sm">
                              View
                            </Button>
                          </Link>
                          {canCancel &&
                            policy.status !== 'CANCELLED' &&
                            policy.status !== 'RENEWED' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setPendingCancelId(policy.id)}
                              >
                                Cancel
                              </Button>
                            )}
                          {canDelete && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setPendingDeleteId(policy.id)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
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
                itemLabel="policies"
                pageSize={limit}
                onPageSizeChange={(size) => updateParams({ limit: String(size) })}
              />
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={pendingCancelId !== null}
        title="Cancel this policy?"
        description="The policy status will be set to CANCELLED. This does not delete any records."
        confirmLabel="Cancel Policy"
        isLoading={isActing}
        onConfirm={handleConfirmCancel}
        onCancel={() => setPendingCancelId(null)}
      />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete this policy?"
        description="This policy will be removed from active lists. Records are retained, not permanently deleted."
        confirmLabel="Delete"
        isLoading={isActing}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
