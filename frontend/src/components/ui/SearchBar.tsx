import { useState, type FormEvent } from 'react';

interface SearchBarProps {
  initialValue?: string;
  onSearch: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({
  initialValue = '',
  onSearch,
  placeholder = 'Search by name, email, or phone…',
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSearch(value.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label="Search customers"
        className="w-full max-w-sm rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-ink-700)] focus:ring-2 focus:ring-[var(--color-ink-700)]/15"
      />
      <button
        type="submit"
        className="rounded-md border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-ink-900)] hover:bg-[var(--color-surface-muted)]"
      >
        Search
      </button>
    </form>
  );
}
