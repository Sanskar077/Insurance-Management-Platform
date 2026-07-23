import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] bg-white px-6 py-16 text-center">
      <p className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-ink-900)]">
        {title}
      </p>
      {description && (
        <p className="max-w-sm text-sm text-[var(--color-slate-500)]">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
