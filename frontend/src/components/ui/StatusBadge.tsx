const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-[var(--color-success-100)] text-[var(--color-success-600)]',
  EXPIRED: 'bg-[var(--color-warning-100)] text-[var(--color-warning-600)]',
  CANCELLED: 'bg-[var(--color-danger-100)] text-[var(--color-danger-600)]',
  RENEWED: 'bg-[var(--color-surface-muted)] text-[var(--color-slate-600)]',
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const style =
    STATUS_STYLES[status] ?? 'bg-[var(--color-surface-muted)] text-[var(--color-slate-600)]';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${style}`}
    >
      {status}
    </span>
  );
}
