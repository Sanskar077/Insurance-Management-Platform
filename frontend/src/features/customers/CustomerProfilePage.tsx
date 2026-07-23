import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOwnProfile } from '@services/customer.service';
import type { Customer } from '@app-types/customer.types';
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

export function CustomerProfilePage() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  function load() {
    setStatus('loading');
    getOwnProfile()
      .then((result) => {
        setCustomer(result);
        setStatus('idle');
      })
      .catch((error) => {
        setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load your profile');
        setStatus('error');
      });
  }

  useEffect(load, []);

  if (status === 'loading') return <Spinner label="Loading your profile…" />;
  if (status === 'error') return <ErrorState message={errorMessage} onRetry={load} />;
  if (!customer) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink-900)]">
        My Profile
      </h1>

      <div className="rounded-lg border border-[var(--color-border)] bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar fullName={customer.fullName} />
            <div>
              <p className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-ink-900)]">
                {customer.fullName}
              </p>
              <p className="text-sm text-[var(--color-slate-500)]">{customer.email}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/customers/${customer.id}/edit`)}
          >
            Edit phone / address
          </Button>
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
        </dl>
      </div>
    </div>
  );
}
