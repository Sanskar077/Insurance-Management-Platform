import { Button } from '@components/ui/Button';
import type { PaginationMeta } from '@app-types/customer.types';

const PAGE_SIZE_OPTIONS = [10, 25, 50];

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  /** Entity noun for the summary line, e.g. "policies". Defaults to "records". */
  itemLabel?: string;
  /** When provided (with onPageSizeChange), renders a page-size selector. */
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}

export function Pagination({
  meta,
  onPageChange,
  itemLabel = 'records',
  pageSize,
  onPageSizeChange,
}: PaginationProps) {
  const { currentPage, totalPages, totalRecords, hasNext, hasPrevious } = meta;

  const size = pageSize ?? 10;
  const rangeStart = totalRecords === 0 ? 0 : (currentPage - 1) * size + 1;
  const rangeEnd = Math.min(currentPage * size, totalRecords);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-3">
      <p className="text-sm text-[var(--color-slate-500)]">
        Showing {rangeStart}–{rangeEnd} of {totalRecords} {itemLabel} · Page {currentPage} of{' '}
        {totalPages}
      </p>
      <div className="flex items-center gap-3">
        {pageSize !== undefined && onPageSizeChange && (
          <label className="flex items-center gap-2 text-sm text-[var(--color-slate-500)]">
            Per page
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="rounded-md border border-[var(--color-border)] bg-white px-2 py-1.5 text-sm text-[var(--color-ink-900)] outline-none focus:border-[var(--color-ink-700)]"
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={!hasPrevious}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!hasNext}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
