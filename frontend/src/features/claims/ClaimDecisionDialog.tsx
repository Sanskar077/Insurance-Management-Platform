import { useState } from 'react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';

interface ClaimDecisionDialogProps {
  mode: 'approve' | 'reject';
  open: boolean;
  claimAmount: string;
  isLoading?: boolean;
  onConfirm: (payload: { approvedAmount?: number; remarks: string }) => void;
  onCancel: () => void;
}

export function ClaimDecisionDialog({
  mode,
  open,
  claimAmount,
  isLoading = false,
  onConfirm,
  onCancel,
}: ClaimDecisionDialogProps) {
  const [approvedAmount, setApprovedAmount] = useState(claimAmount);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const isApprove = mode === 'approve';

  function handleConfirm() {
    setError('');
    if (isApprove) {
      const amount = Number(approvedAmount);
      if (!amount || amount <= 0) {
        setError('Enter a valid approved amount');
        return;
      }
      if (amount > Number(claimAmount)) {
        setError('Approved amount cannot exceed the claim amount');
        return;
      }
      onConfirm({ approvedAmount: amount, remarks });
    } else {
      if (remarks.trim().length < 3) {
        setError('A reason for rejection is required');
        return;
      }
      onConfirm({ remarks });
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-ink-950)]/50 px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">
          {isApprove ? 'Approve Claim' : 'Reject Claim'}
        </h2>
        <p className="mt-2 text-sm text-[var(--color-slate-600)]">
          {isApprove
            ? 'Enter the approved payout amount. It cannot exceed the claimed amount.'
            : 'Provide a reason so the customer understands the decision.'}
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {isApprove && (
            <Input
              label="Approved amount"
              type="number"
              min="0.01"
              step="0.01"
              max={claimAmount}
              value={approvedAmount}
              onChange={(event) => setApprovedAmount(event.target.value)}
            />
          )}
          <Input
            label={isApprove ? 'Remarks (optional)' : 'Reason for rejection'}
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
          />
          {error && <p className="text-sm text-[var(--color-danger-600)]">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={isApprove ? 'primary' : 'danger'}
            size="sm"
            onClick={handleConfirm}
            isLoading={isLoading}
          >
            {isApprove ? 'Approve' : 'Reject'}
          </Button>
        </div>
      </div>
    </div>
  );
}
