import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { globalSearch } from '@services/search.service';
import type { GlobalSearchResults } from '@app-types/search.types';
import { StatusBadge } from '@components/ui/StatusBadge';
import { Spinner } from '@components/ui/Spinner';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

interface ResultRowProps {
  onSelect: () => void;
  primary: string;
  secondary?: string;
  status?: string;
}

function ResultRow({ onSelect, primary, secondary, status }: ResultRowProps) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onSelect}
      className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm hover:bg-[var(--color-surface-muted)]"
    >
      <span className="min-w-0">
        <span className="block truncate font-medium text-[var(--color-ink-900)]">{primary}</span>
        {secondary && (
          <span className="block truncate text-xs text-[var(--color-slate-500)]">{secondary}</span>
        )}
      </span>
      {status && <StatusBadge status={status} />}
    </button>
  );
}

function SectionHeading({ label }: { label: string }) {
  return (
    <p className="bg-[var(--color-surface-muted)] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-slate-500)]">
      {label}
    </p>
  );
}

/**
 * Debounced global search box for the app header. Queries GET /api/search
 * and renders grouped results; selecting a hit navigates to its detail page.
 */
export function GlobalSearch() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const term = query.trim();
    if (term.length < MIN_QUERY_LENGTH) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await globalSearch(term);
        setResults(data);
        setIsOpen(true);
      } catch {
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  // Close the dropdown when clicking outside or pressing Escape.
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  function goTo(path: string) {
    setIsOpen(false);
    setQuery('');
    navigate(path);
  }

  const hasResults =
    results !== null &&
    (results.customers.length > 0 ||
      results.policies.length > 0 ||
      results.claims.length > 0 ||
      results.payments.length > 0 ||
      results.documents.length > 0);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => results && setIsOpen(true)}
        placeholder="Search customers, policies, claims…"
        aria-label="Global search"
        className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-ink-700)] focus:ring-2 focus:ring-[var(--color-ink-700)]/15"
      />

      {isOpen && query.trim().length >= MIN_QUERY_LENGTH && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-96 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-white shadow-lg">
          {isLoading && <Spinner label="Searching…" />}

          {!isLoading && !hasResults && (
            <p className="px-4 py-3 text-sm text-[var(--color-slate-500)]">
              No results for “{query.trim()}”.
            </p>
          )}

          {!isLoading && results && results.customers.length > 0 && (
            <div>
              <SectionHeading label="Customers" />
              {results.customers.map((hit) => (
                <ResultRow
                  key={hit.id}
                  primary={hit.fullName}
                  secondary={hit.email}
                  onSelect={() => goTo(`/customers/${hit.id}`)}
                />
              ))}
            </div>
          )}

          {!isLoading && results && results.policies.length > 0 && (
            <div>
              <SectionHeading label="Policies" />
              {results.policies.map((hit) => (
                <ResultRow
                  key={hit.id}
                  primary={hit.policyNumber}
                  secondary={`${hit.policyType} · ${hit.customerName}`}
                  status={hit.status}
                  onSelect={() => goTo(`/policies/${hit.id}`)}
                />
              ))}
            </div>
          )}

          {!isLoading && results && results.claims.length > 0 && (
            <div>
              <SectionHeading label="Claims" />
              {results.claims.map((hit) => (
                <ResultRow
                  key={hit.id}
                  primary={hit.claimNumber}
                  secondary={`Policy ${hit.policyNumber}`}
                  status={hit.status}
                  onSelect={() => goTo(`/claims/${hit.id}`)}
                />
              ))}
            </div>
          )}

          {!isLoading && results && results.payments.length > 0 && (
            <div>
              <SectionHeading label="Premium Payments" />
              {results.payments.map((hit) => (
                <ResultRow
                  key={hit.id}
                  primary={hit.transactionReference ?? `Payment on ${hit.policyNumber}`}
                  secondary={`$${Number(hit.amount).toLocaleString()} · Policy ${hit.policyNumber}`}
                  status={hit.paymentStatus}
                  onSelect={() => goTo(`/premium-payments/${hit.id}`)}
                />
              ))}
            </div>
          )}

          {!isLoading && results && results.documents.length > 0 && (
            <div>
              <SectionHeading label="Documents" />
              {results.documents.map((hit) => (
                <ResultRow
                  key={hit.id}
                  primary={hit.originalFileName}
                  secondary={hit.entityType}
                  onSelect={() => goTo(`/documents/${hit.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
