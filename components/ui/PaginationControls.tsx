'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { PaginationMeta } from '@/lib/types';

interface PaginationControlsProps {
  pagination?: PaginationMeta;
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange?: (newSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
}

export function PaginationControls({
  pagination,
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  itemLabel = 'items',
  className = '',
}: PaginationControlsProps) {
  const total = pagination?.total ?? totalItems;
  const page = pagination?.page ?? currentPage;
  const limit = pagination?.limit ?? pageSize;
  const totalPages = pagination?.pages ?? Math.max(1, Math.ceil(total / limit));

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  if (total === 0) return null;

  return (
    <div
      className={`p-3.5 bg-white border border-slate-200/90 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs select-none ${className}`}
    >
      {/* Left: Summary text & page size selector */}
      <div className="flex items-center gap-3 text-slate-500 flex-wrap justify-center sm:justify-start">
        <span>
          Showing <strong className="text-slate-800 font-mono">{startItem}</strong> to{' '}
          <strong className="text-slate-800 font-mono">{endItem}</strong> of{' '}
          <strong className="text-slate-900 font-mono">{total.toLocaleString()}</strong> {itemLabel}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <span className="text-[11px] text-slate-400">Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="py-1 px-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium text-xs focus:bg-white outline-none cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page navigation buttons */}
      <div className="flex items-center gap-1 flex-wrap justify-center">
        {/* First page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          title="First page"
          className="hidden sm:inline-flex p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Previous page */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          title="Previous page"
          className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Numbered pages */}
        <div className="flex items-center gap-0.5 sm:gap-1 px-0.5 sm:px-1 overflow-x-auto max-w-full">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 font-mono text-xs">
                  ...
                </span>
              );
            }

            const pageNum = Number(p);
            const isActive = pageNum === page;

            return (
              <button
                key={`page-${pageNum}`}
                onClick={() => onPageChange(pageNum)}
                className={`min-w-[26px] sm:min-w-[28px] h-7 px-1.5 sm:px-2 rounded-lg font-bold font-mono text-xs transition-all ${
                  isActive
                    ? 'bg-[#e60012] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next page */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          title="Next page"
          className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          title="Last page"
          className="hidden sm:inline-flex p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
