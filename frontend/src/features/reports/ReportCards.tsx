import type { ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  accent?: 'default' | 'success' | 'warning' | 'danger';
}

const ACCENT_STYLES: Record<NonNullable<KpiCardProps['accent']>, string> = {
  default: 'text-[var(--color-ink-900)]',
  success: 'text-[var(--color-success-600)]',
  warning: 'text-[var(--color-warning-600)]',
  danger: 'text-[var(--color-danger-600)]',
};

/** Stat tile: label + value + optional secondary hint line. */
export function KpiCard({ label, value, hint, accent = 'default' }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-slate-500)]">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold ${ACCENT_STYLES[accent]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--color-slate-500)]">{hint}</p>}
    </div>
  );
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/** Shared wrapper so every chart panel gets the same chrome. */
export function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5">
      <h2 className="text-base font-semibold text-[var(--color-ink-900)]">{title}</h2>
      {subtitle && <p className="mb-3 text-xs text-[var(--color-slate-500)]">{subtitle}</p>}
      <div className="mt-3 h-64">{children}</div>
    </div>
  );
}
