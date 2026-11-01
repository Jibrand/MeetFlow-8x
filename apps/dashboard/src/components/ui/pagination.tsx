import { Button } from '@meetflow/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = '',
}: PaginationProps) {
  if (totalItems === 0) return null;

  const startItem = Math.min(totalItems, (currentPage - 1) * pageSize + 1);
  const endItem = Math.min(totalItems, currentPage * pageSize);

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground ${className}`}
      aria-label="Pagination Navigation"
    >
      <div className="text-[12px]">
        Showing <span className="font-medium text-foreground">{startItem}</span>–
        <span className="font-medium text-foreground">{endItem}</span> of{' '}
        <span className="font-medium text-foreground">{totalItems}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canPrev}
          className="h-8 px-2.5 text-xs gap-1 disabled:opacity-40"
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Previous</span>
        </Button>

        <span className="px-2 text-xs font-mono">
          {currentPage} / {Math.max(1, totalPages)}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canNext}
          className="h-8 px-2.5 text-xs gap-1 disabled:opacity-40"
          aria-label="Go to next page"
        >
          <span>Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
