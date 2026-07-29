interface ProgressBarProps {
  percent: number;
}

export function ProgressBar({ percent }: ProgressBarProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
        <div
          className="h-full rounded-full bg-[var(--color-amber-500)] transition-all duration-150"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-[var(--color-slate-500)]">{percent}% uploaded</p>
    </div>
  );
}
