import { useEffect, useRef, useState } from 'react';
import { listCustomers } from '@services/customer.service';
import type { Customer } from '@app-types/customer.types';
import { Input } from '@components/ui/Input';

interface CustomerPickerProps {
  value: string;
  selectedLabel: string;
  onChange: (customerId: string, label: string) => void;
  error?: string;
}

export function CustomerPicker({ value, selectedLabel, onChange, error }: CustomerPickerProps) {
  const [query, setQuery] = useState(selectedLabel);
  const [results, setResults] = useState<Customer[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(selectedLabel);
  }, [selectedLabel]);

  useEffect(() => {
    if (!isOpen || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      listCustomers({ page: 1, limit: 5, search: query.trim() })
        .then((result) => setResults(result.data))
        .catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(customer: Customer) {
    onChange(customer.id, customer.fullName);
    setQuery(customer.fullName);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        label="Customer"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
          if (event.target.value !== selectedLabel) {
            onChange('', '');
          }
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Search by name, email, or phone…"
        error={error}
        autoComplete="off"
      />
      <input type="hidden" value={value} />
      {isOpen && results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-md border border-[var(--color-border)] bg-white shadow-lg">
          {results.map((customer) => (
            <li key={customer.id}>
              <button
                type="button"
                onClick={() => handleSelect(customer)}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-surface-muted)]"
              >
                <span className="font-medium text-[var(--color-ink-900)]">{customer.fullName}</span>
                <span className="ml-2 text-[var(--color-slate-500)]">{customer.email}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
