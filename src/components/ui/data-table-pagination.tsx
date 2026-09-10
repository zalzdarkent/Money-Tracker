import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

export function generatePaginationRange(
  currentPage: number,
  totalPages: number,
  siblingCount = 1
): (number | string)[] {
  // If total pages is small (<= 5), show all pages: [1, 2, 3, 4, 5]
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

  // Case 1: No left dots to show, but right dots to be shown
  // e.g. [1, 2, 3, '...', 10]
  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftRange = [1, 2, 3];
    return [...leftRange, "...", totalPages];
  }

  // Case 2: No right dots to show, but left dots to be shown
  // e.g. [1, '...', 8, 9, 10]
  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightRange = [totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", ...rightRange];
  }

  // Case 3: Both left and right dots to be shown
  // e.g. [1, '...', 4, 5, 6, '...', 10]
  if (shouldShowLeftDots && shouldShowRightDots) {
    const middleRange: number[] = [];
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      middleRange.push(i);
    }
    return [1, "...", ...middleRange, "...", totalPages];
  }

  return Array.from({ length: totalPages }, (_, i) => i + 1);
}

export function DataTablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  siblingCount = 1,
}: DataTablePaginationProps) {
  if (totalItems === 0) return null;

  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const pageRange = generatePaginationRange(validCurrentPage, totalPages, siblingCount);

  const startItem = (validCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(validCurrentPage * pageSize, totalItems);

  return (
    <div className="p-3.5 sm:p-4 border-t border-[#27272a] bg-[#121214] flex flex-col sm:flex-row items-center justify-between gap-3">
      {/* Items range indicator */}
      <div className="text-xs text-zinc-400 font-mono text-center sm:text-left">
        Menampilkan{" "}
        <span className="text-white font-semibold">{startItem}</span> -{" "}
        <span className="text-white font-semibold">{endItem}</span> dari{" "}
        <span className="text-emerald-400 font-semibold">{totalItems}</span> transaksi
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center">
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={validCurrentPage <= 1}
          className="p-1.5 rounded-lg border border-[#27272a] bg-[#18181b] text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95"
          title="Halaman Pertama"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, validCurrentPage - 1))}
          disabled={validCurrentPage <= 1}
          className="p-1.5 rounded-lg border border-[#27272a] bg-[#18181b] text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95"
          title="Halaman Sebelumnya"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Numeric Page Buttons & Ellipses */}
        <div className="flex items-center gap-1 mx-0.5">
          {pageRange.map((pageNumber, idx) => {
            if (pageNumber === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1.5 py-1 text-xs font-mono text-zinc-500 select-none"
                >
                  &hellip;
                </span>
              );
            }

            const pageNum = Number(pageNumber);
            const isActive = pageNum === validCurrentPage;

            return (
              <button
                key={`page-${pageNum}`}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`min-w-8 h-8 px-2 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer select-none active:scale-95 ${
                  isActive
                    ? "bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20 border border-emerald-400"
                    : "bg-[#18181b] border border-[#27272a] text-zinc-300 hover:text-white hover:border-zinc-600 hover:bg-[#27272a]"
                }`}
                title={`Halaman ${pageNum}`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, validCurrentPage + 1))}
          disabled={validCurrentPage >= totalPages}
          className="p-1.5 rounded-lg border border-[#27272a] bg-[#18181b] text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95"
          title="Halaman Selanjutnya"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={validCurrentPage >= totalPages}
          className="p-1.5 rounded-lg border border-[#27272a] bg-[#18181b] text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95"
          title="Halaman Terakhir"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
