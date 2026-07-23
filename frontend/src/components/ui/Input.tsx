import type { InputHTMLAttributes } from 'react';
import { useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, className = '', ...rest }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-ink-900)]">
        {label}
      </label>
      <input
        id={inputId}
        className={`rounded-md border bg-white px-3 py-2 text-sm text-[var(--color-ink-900)] outline-none transition-colors focus:border-[var(--color-ink-700)] focus:ring-2 focus:ring-[var(--color-ink-700)]/15 ${
          error ? 'border-[var(--color-danger-600)]' : 'border-[var(--color-border)]'
        } ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...rest}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-[var(--color-danger-600)]">
          {error}
        </p>
      )}
    </div>
  );
}
