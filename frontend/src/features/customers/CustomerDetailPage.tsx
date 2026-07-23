import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCustomerById } from '@services/customer.service';
import type { Customer } from '@app-types/customer.types';
import { useAuth } from '@hooks/useAuth';
import { Button } from '@components/ui/Button';
import { Spinner } from '@components/ui/Spinner';
import { ErrorState } from '@components/ui/ErrorState';
import { Avatar } from '@components/ui/Avatar';
import { ApiError } from '@lib/apiClient';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const canEdit = role === 'ADMIN' || role === 'AGENT' || role === 'CUSTOMER';

  function load() {
    if (!id) return;
    setStatus('loading');
    getCustomerById(id)
      .then((result) => {
        setCustomer(result);
        setStatus('idle');
      })
      .catch((error) => {
        setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load customer');
        setStatus('error');
      });
  }

  useEffect(load, [id]);

  if (status === 'loading') return <Spinner label="Loading customer…" />;
  if (status === 'error') return <ErrorState message={errorMessage} onRetry={load} />;
  if (!customer) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/customers"
        className="mb-4 inline-block text-sm text-[var(--color-slate-500)] hover:text-[var(--color-ink-900)]"
      >
        ← Back to customers
      </Link>

      <div className="rounded-lg border border-[var(--color-border)] bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar fullName={customer.fullName} />
            <div>
              <h1 className="font-[var(--font-display)] text-xl font-semibold text-[var(--color-ink-900)]">
                {customer.fullName}
              </h1>
              <p className="text-sm text-[var(--color-slate-500)]">{customer.email}</p>
            </div>
          </div>
          {canEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/customers/${customer.id}/edit`)}
            >
              Edit
            </Button>
          )}
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-[var(--color-border)] pt-6 text-sm">
          <div>
            <dt className="text-[var(--color-slate-500)]">Phone</dt>
            <dd className="mt-1 font-medium text-[var(--color-ink-900)]">{customer.phone}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-slate-500)]">Date of birth</dt>
            <dd className="mt-1 font-medium text-[var(--color-ink-900)]">
              {formatDate(customer.dob)}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[var(--color-slate-500)]">Address</dt>
            <dd className="mt-1 font-medium text-[var(--color-ink-900)]">{customer.address}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-slate-500)]">Customer since</dt>
            <dd className="mt-1 font-medium text-[var(--color-ink-900)]">
              {formatDate(customer.createdAt)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 rounded-lg border border-dashed border-[var(--color-border)] bg-white p-6 text-center">
        <p className="text-sm font-medium text-[var(--color-ink-900)]">Customer History</p>
        <p className="mt-1 text-sm text-[var(--color-slate-500)]">
          Policy, claim, and payment history will appear here in a future update.
        </p>
      </div>
    </div>
  );
}
