"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalResults: number;
  startIndex: number;
  endIndex: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalResults,
  startIndex,
  endIndex,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-3 py-3 border-t border-border/40 bg-white/[0.01] rounded-b-xl text-xs flex-wrap gap-2">
      <div className="text-muted-foreground">
        Showing <span className="font-medium text-slate-300">{startIndex + 1}</span> to{" "}
        <span className="font-medium text-slate-300">{Math.min(endIndex, totalResults)}</span> of{" "}
        <span className="font-medium text-slate-300">{totalResults}</span> results
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1 rounded bg-secondary hover:bg-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-border/50 text-slate-300"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-muted-foreground font-medium px-2">
          Page {currentPage} of {totalPages}
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1 rounded bg-secondary hover:bg-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-border/50 text-slate-300"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
