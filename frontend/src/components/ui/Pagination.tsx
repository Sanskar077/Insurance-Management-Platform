import { Button } from '@components/ui/Button';
import type { PaginationMeta } from '@app-types/customer.types';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  const { currentPage, totalPages, totalRecords, hasNext, hasPrevious } = meta;

  return (
    <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-3">
      <p className="text-sm text-[var(--color-slate-500)]">
        Page {currentPage} of {totalPages} · {totalRecords} total customer
        {totalRecords === 1 ? '' : 's'}
      </p>
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
  );
}
