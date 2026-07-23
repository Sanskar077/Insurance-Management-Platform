import { Button } from '@components/ui/Button';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-[var(--color-danger-100)] bg-[var(--color-danger-100)]/40 px-6 py-16 text-center">
      <p className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-danger-600)]">
        Something went wrong
      </p>
      <p className="max-w-sm text-sm text-[var(--color-ink-900)]">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
