interface SpinnerProps {
  label?: string;
}

export function Spinner({ label = 'Loading…' }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 py-16 text-[var(--color-slate-500)]"
    >
      <span
        className="h-8 w-8 animate-spin rounded-full border-[3px] border-[var(--color-border)] border-t-[var(--color-ink-800)]"
        aria-hidden="true"
      />
      <p className="text-sm">{label}</p>
    </div>
  );
}
