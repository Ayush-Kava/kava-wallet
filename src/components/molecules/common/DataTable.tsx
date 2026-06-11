'use client';

import { useState, ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from '@/components/atoms/ui/table';
import { Button } from '@/components/atoms/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  className?: string;
}

export interface PaginatedTableProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  itemsPerPage?: number;
  showPagination?: boolean;
  footerContent?: (totals: any) => ReactNode;
  isLoading?: boolean;
  loadingRows?: number;
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
}

export function PaginatedTable<T extends { id: string }>({
  data,
  columns,
  itemsPerPage = 10,
  showPagination = true,
  footerContent,
  isLoading = false,
  loadingRows = 5,
  currentPage: externalPage,
  totalPages: externalTotalPages,
  totalCount: externalTotalCount,
  onPageChange,
}: PaginatedTableProps<T>) {
  const [internalPage, setInternalPage] = useState(1);

  // Use external state if provided, otherwise use internal state
  const currentPage = externalPage ?? internalPage;
  const isControlled = externalPage !== undefined && onPageChange !== undefined;

  // Calculate pagination values
  const totalPages = externalTotalPages ?? Math.ceil(data.length / itemsPerPage);
  const totalCount = externalTotalCount ?? data.length;

  // For server-side pagination, use data as-is. For client-side, slice it
  const displayData = isControlled
    ? data
    : data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePreviousPage = () => {
    const newPage = Math.max(currentPage - 1, 1);
    if (isControlled && onPageChange) {
      onPageChange(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  const handleNextPage = () => {
    const newPage = Math.min(currentPage + 1, totalPages);
    if (isControlled && onPageChange) {
      onPageChange(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  const handlePageClick = (page: number) => {
    if (isControlled && onPageChange) {
      onPageChange(page);
    } else {
      setInternalPage(page);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const renderCellContent = (item: T, column: Column<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(item);
    }
    return (item[column.accessor] as ReactNode) || '-';
  };

  return (
    <div className="overflow-hidden rounded-xl border-0 bg-card shadow-card">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            {columns.map((column, idx) => (
              <TableHead key={idx}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading
            ? [...Array(loadingRows)].map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, colIdx) => (
                    <TableCell key={colIdx}>
                      <div className="h-4 animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : displayData.map(item => (
                <TableRow key={item.id}>
                  {columns.map((column, colIdx) => (
                    <TableCell key={colIdx} className={column.className}>
                      {renderCellContent(item, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
        </TableBody>
      </Table>

      {/* Footer joined with table */}
      {showPagination && (
        <div className="border-t bg-card">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-8">
              <div className="text-sm text-muted-foreground">
                Showing {data.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
                {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
              </div>
              {footerContent && footerContent({})}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || isLoading}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft size={16} />
              </Button>

              {/* Page number buttons */}
              {getPageNumbers().map((page, idx) => (
                <Button
                  key={idx}
                  variant={page === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => typeof page === 'number' && handlePageClick(page)}
                  disabled={typeof page !== 'number' || isLoading}
                  className="h-8 min-w-8 px-2"
                >
                  {page}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages || isLoading}
                className="h-8 w-8 p-0"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export individual components for custom usage
export {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from '@/components/atoms/ui/table';
