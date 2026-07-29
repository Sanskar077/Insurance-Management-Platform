import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { listCustomers, deleteCustomer } from '@services/customer.service';
import type { Customer, PaginationMeta } from '@app-types/customer.types';
import { useAuth } from '@hooks/useAuth';
import { useToast } from '@components/ui/ToastProvider';
import { Button } from '@components/ui/Button';
import { Spinner } from '@components/ui/Spinner';
import { EmptyState } from '@components/ui/EmptyState';
import { ErrorState } from '@components/ui/ErrorState';
import { Pagination } from '@components/ui/Pagination';
import { SearchBar } from '@components/ui/SearchBar';
import { ConfirmDialog } from '@components/ui/ConfirmDialog';
import { Avatar } from '@components/ui/Avatar';
import { Select } from '@components/ui/Select';
import { ApiError } from '@lib/apiClient';

type SortKey = 'createdAt-desc' | 'createdAt-asc' | 'fullName-asc' | 'fullName-desc';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'createdAt-desc', label: 'Newest first' },
  { value: 'createdAt-asc', label: 'Oldest first' },
  { value: 'fullName-asc', label: 'Name A–Z' },
  { value: 'fullName-desc', label: 'Name Z–A' },
];

export function CustomerListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1');
  const limit = Number(searchParams.get('limit') ?? '10');
  const search = searchParams.get('search') ?? '';
  const sort = (searchParams.get('sort') as SortKey | null) ?? 'createdAt-desc';

  const { role } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canCreate = role === 'ADMIN' || role === 'AGENT';
  const canDelete = role === 'ADMIN';

  const fetchCustomers = useCallback(async () => {
    setStatus('loading');
    const [sortBy, sortOrder] = sort.split('-') as ['fullName' | 'createdAt', 'asc' | 'desc'];
    try {
      const result = await listCustomers({
        page,
        limit,
        search: search || undefined,
        sortBy,
        sortOrder,
      });
      setCustomers(result.data);
      setMeta(result.meta);
      setStatus('idle');
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load customers');
      setStatus('error');
    }
  }, [page, limit, search, sort]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  function updateParams(partial: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(partial)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.set('page', '1');
    setSearchParams(params);
  }

  function handleSearch(value: string) {
    updateParams({ search: value || undefined });
  }

  function handlePageChange(nextPage: number) {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(nextPage));
    setSearchParams(params);
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteId) return;
    setIsDeleting(true);
    try {
      await deleteCustomer(pendingDeleteId);
      showSuccess('Customer deleted successfully');
      setPendingDeleteId(null);
      await fetchCustomers();
    } catch (error) {
      showError(error instanceof ApiError ? error.message : 'Failed to delete customer');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink-900)]">
            Customers
          </h1>
          <p className="text-sm text-[var(--color-slate-500)]">
            Manage customer profiles and account details.
          </p>
        </div>
        {canCreate && <Button onClick={() => navigate('/customers/new')}>+ New Customer</Button>}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <SearchBar initialValue={search} onSearch={handleSearch} />
        <div className="w-44">
          <Select
            label="Sort by"
            value={sort}
            onChange={(event) => updateParams({ sort: event.target.value })}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
        {status === 'loading' && <Spinner label="Loading customers…" />}

        {status === 'error' && <ErrorState message={errorMessage} onRetry={fetchCustomers} />}

        {status === 'idle' && customers.length === 0 && (
          <EmptyState
            title={search ? 'No matching customers' : 'No customers yet'}
            description={
              search
                ? 'Try a different name, email, or phone number.'
                : canCreate
                  ? 'Get started by registering your first customer.'
                  : 'Check back once customers have been registered.'
            }
            action={
              canCreate && !search ? (
                <Button size="sm" onClick={() => navigate('/customers/new')}>
                  + New Customer
                </Button>
              ) : undefined
            }
          />
        )}

        {status === 'idle' && customers.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-[var(--color-surface-muted)] text-xs uppercase tracking-wide text-[var(--color-slate-500)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-t border-[var(--color-border)]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar fullName={customer.fullName} size="sm" />
                          <Link
                            to={`/customers/${customer.id}`}
                            className="font-medium text-[var(--color-ink-900)] hover:underline"
                          >
                            {customer.fullName}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-slate-600)]">{customer.email}</td>
                      <td className="px-4 py-3 text-[var(--color-slate-600)]">{customer.phone}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link to={`/customers/${customer.id}`}>
                            <Button variant="secondary" size="sm">
                              View
                            </Button>
                          </Link>
                          {canDelete && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setPendingDeleteId(customer.id)}
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
                itemLabel="customers"
                pageSize={limit}
                onPageSizeChange={(size) => updateParams({ limit: String(size) })}
              />
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete this customer?"
        description="This customer will be removed from active lists. Their records are retained, not permanently deleted."
        confirmLabel="Delete"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
