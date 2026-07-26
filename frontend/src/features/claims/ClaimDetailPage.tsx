import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  approveClaim,
  closeClaim,
  getClaimById,
  rejectClaim,
  updateClaim,
} from '@services/claim.service';
import type { Claim } from '@app-types/claim.types';
import { ALLOWED_TRANSITIONS } from '@app-types/claim.types';
import { useAuth } from '@hooks/useAuth';
import { useToast } from '@components/ui/ToastProvider';
import { Button } from '@components/ui/Button';
import { Spinner } from '@components/ui/Spinner';
import { ErrorState } from '@components/ui/ErrorState';
import { StatusBadge } from '@components/ui/StatusBadge';
import { ConfirmDialog } from '@components/ui/ConfirmDialog';
import { ClaimDecisionDialog } from '@features/claims/ClaimDecisionDialog';
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

export function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { showSuccess, showError } = useToast();

  const [claim, setClaim] = useState<Claim | null>(null);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [dialogMode, setDialogMode] = useState<'approve' | 'reject' | null>(null);
  const [pendingClose, setPendingClose] = useState(false);
  const [isActing, setIsActing] = useState(false);

  const canManage = role === 'ADMIN' || role === 'AGENT';

  function load() {
    if (!id) return;
    setStatus('loading');
    getClaimById(id)
      .then((result) => {
        setClaim(result);
        setStatus('idle');
      })
      .catch((error) => {
        setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load claim');
        setStatus('error');
      });
  }

  useEffect(load, [id]);

  const canTransitionTo = (target: string) =>
    claim ? ALLOWED_TRANSITIONS[claim.status].includes(target as never) : false;

  async function handleMarkUnderReview() {
    if (!id) return;
    setIsActing(true);
    try {
      const updated = await updateClaim(id, { status: 'UNDER_REVIEW' });
      setClaim(updated);
      showSuccess('Claim marked as under review');
    } catch (error) {
      showError(error instanceof ApiError ? error.message : 'Failed to update claim');
    } finally {
      setIsActing(false);
    }
  }

  async function handleDecision(payload: { approvedAmount?: number; remarks: string }) {
    if (!id || !dialogMode) return;
    setIsActing(true);
    try {
      const updated =
        dialogMode === 'approve'
          ? await approveClaim(id, {
              approvedAmount: payload.approvedAmount!,
              remarks: payload.remarks || undefined,
            })
          : await rejectClaim(id, { remarks: payload.remarks });
      setClaim(updated);
      showSuccess(dialogMode === 'approve' ? 'Claim approved' : 'Claim rejected');
      setDialogMode(null);
    } catch (error) {
      showError(error instanceof ApiError ? error.message : 'Failed to record decision');
    } finally {
      setIsActing(false);
    }
  }

  async function handleClose() {
    if (!id) return;
    setIsActing(true);
    try {
      const updated = await closeClaim(id, {});
      setClaim(updated);
      showSuccess('Claim closed');
      setPendingClose(false);
    } catch (error) {
      showError(error instanceof ApiError ? error.message : 'Failed to close claim');
    } finally {
      setIsActing(false);
    }
  }

  if (status === 'loading') return <Spinner label="Loading claim…" />;
  if (status === 'error') return <ErrorState message={errorMessage} onRetry={load} />;
  if (!claim) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/claims"
        className="mb-4 inline-block text-sm text-[var(--color-slate-500)] hover:text-[var(--color-ink-900)]"
      >
        ← Back to claims
      </Link>

      <div className="rounded-lg border border-[var(--color-border)] bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-[var(--font-display)] text-xl font-semibold text-[var(--color-ink-900)]">
              {claim.claimNumber}
            </h1>
            <Link
              to={`/policies/${claim.policyId}`}
              className="mt-1 inline-block text-sm text-[var(--color-slate-500)] hover:underline"
            >
              View policy
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={claim.status} />
            {canManage && claim.status !== 'CLOSED' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/claims/${claim.id}/edit`)}
              >
                Edit
              </Button>
            )}
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-[var(--color-border)] pt-6 text-sm">
          <div>
            <dt className="text-[var(--color-slate-500)]">Type</dt>
            <dd className="mt-1 font-medium text-[var(--color-ink-900)]">{claim.claimType}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-slate-500)]">Claim amount</dt>
            <dd className="mt-1 font-medium text-[var(--color-ink-900)]">
              {formatMoney(claim.claimAmount)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--color-slate-500)]">Incident date</dt>
            <dd className="mt-1 font-medium text-[var(--color-ink-900)]">
              {formatDate(claim.incidentDate)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--color-slate-500)]">Claim date</dt>
            <dd className="mt-1 font-medium text-[var(--color-ink-900)]">
              {formatDate(claim.claimDate)}
            </dd>
          </div>
          {claim.approvedAmount && (
            <div>
              <dt className="text-[var(--color-slate-500)]">Approved amount</dt>
              <dd className="mt-1 font-medium text-[var(--color-success-600)]">
                {formatMoney(claim.approvedAmount)}
              </dd>
            </div>
          )}
          <div className="col-span-2">
            <dt className="text-[var(--color-slate-500)]">Description</dt>
            <dd className="mt-1 font-medium text-[var(--color-ink-900)]">{claim.description}</dd>
          </div>
          {claim.remarks && (
            <div className="col-span-2">
              <dt className="text-[var(--color-slate-500)]">Remarks</dt>
              <dd className="mt-1 font-medium text-[var(--color-ink-900)]">{claim.remarks}</dd>
            </div>
          )}
        </dl>

        {canManage && claim.status !== 'CLOSED' && (
          <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-[var(--color-border)] pt-6">
            {canTransitionTo('UNDER_REVIEW') && (
              <Button variant="secondary" onClick={handleMarkUnderReview} isLoading={isActing}>
                Mark Under Review
              </Button>
            )}
            {canTransitionTo('REJECTED') && (
              <Button variant="danger" onClick={() => setDialogMode('reject')}>
                Reject
              </Button>
            )}
            {canTransitionTo('APPROVED') && (
              <Button onClick={() => setDialogMode('approve')}>Approve</Button>
            )}
            {canTransitionTo('CLOSED') && (
              <Button variant="secondary" onClick={() => setPendingClose(true)}>
                Close Claim
              </Button>
            )}
          </div>
        )}
      </div>

      <ClaimDecisionDialog
        mode={dialogMode ?? 'approve'}
        open={dialogMode !== null}
        claimAmount={claim.claimAmount}
        isLoading={isActing}
        onConfirm={handleDecision}
        onCancel={() => setDialogMode(null)}
      />

      <ConfirmDialog
        open={pendingClose}
        title="Close this claim?"
        description="Closed claims are final and cannot be modified further."
        confirmLabel="Close Claim"
        isLoading={isActing}
        onConfirm={handleClose}
        onCancel={() => setPendingClose(false)}
      />
    </div>
  );
}
