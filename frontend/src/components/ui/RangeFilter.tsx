import { useEffect, useState } from 'react';

interface RangeFilterProps {
  label: string;
  min?: string;
  max?: string;
  /** Fired on blur or Enter with the trimmed values ('' = cleared). */
  onChange: (min: string, max: string) => void;
}

/**
 * Numeric min/max filter pair. Values commit on blur or Enter (not per
 * keystroke) so list pages don't refetch while the user is still typing.
 */
export function RangeFilter({ label, min = '', max = '', onChange }: RangeFilterProps) {
  const [minValue, setMinValue] = useState(min);
  const [maxValue, setMaxValue] = useState(max);

  // Stay in sync when the URL-driven values change externally (e.g. back nav).
  useEffect(() => setMinValue(min), [min]);
  useEffect(() => setMaxValue(max), [max]);

  function commit() {
    if (minValue.trim() !== min || maxValue.trim() !== max) {
      onChange(minValue.trim(), maxValue.trim());
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    }
  }

  const inputClass =
    'w-24 rounded-md border border-[var(--color-border)] bg-white px-2 py-2 text-sm outline-none focus:border-[var(--color-ink-700)] focus:ring-2 focus:ring-[var(--color-ink-700)]/15';

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-[var(--color-ink-900)]">{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min="0"
          inputMode="decimal"
          value={minValue}
          onChange={(event) => setMinValue(event.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          placeholder="Min"
          aria-label={`${label} minimum`}
          className={inputClass}
        />
        <span className="text-sm text-[var(--color-slate-500)]">–</span>
        <input
          type="number"
          min="0"
          inputMode="decimal"
          value={maxValue}
          onChange={(event) => setMaxValue(event.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          placeholder="Max"
          aria-label={`${label} maximum`}
          className={inputClass}
        />
      </div>
    </div>
  );
}
