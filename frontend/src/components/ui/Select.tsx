import type { SelectHTMLAttributes } from 'react';
import { useId } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

export function Select({ label, error, id, className = '', children, ...rest }: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-[var(--color-ink-900)]">
        {label}
      </label>
      <select
        id={selectId}
        className={`rounded-md border bg-white px-3 py-2 text-sm text-[var(--color-ink-900)] outline-none transition-colors focus:border-[var(--color-ink-700)] focus:ring-2 focus:ring-[var(--color-ink-700)]/15 ${
          error ? 'border-[var(--color-danger-600)]' : 'border-[var(--color-border)]'
        } ${className}`}
        aria-invalid={Boolean(error)}
        {...rest}
      >
        {children}
      </select>
      {error && <p className="text-sm text-[var(--color-danger-600)]">{error}</p>}
    </div>
  );
}
