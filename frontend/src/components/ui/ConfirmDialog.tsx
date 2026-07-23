import { Button } from '@components/ui/Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-ink-950)]/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h2 id="confirm-dialog-title" className="text-lg font-semibold text-[var(--color-ink-900)]">
          {title}
        </h2>
        <p className="mt-2 text-sm text-[var(--color-slate-600)]">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
