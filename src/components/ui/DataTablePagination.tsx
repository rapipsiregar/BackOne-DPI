"use client";

import React from "react";

interface DataTablePaginationProps {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function DataTablePagination({
  totalItems,
  pageSize,
  currentPage,
  totalPages,
  onPageChange,
}: DataTablePaginationProps) {
  if (totalItems <= pageSize) return null;

  const startIndex = (currentPage - 1) * pageSize;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-card/30 flex-wrap gap-3">
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to{" "}
        <span className="font-medium text-foreground">
          {Math.min(startIndex + pageSize, totalItems)}
        </span>{" "}
        of <span className="font-medium text-foreground">{totalItems}</span> results
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-sm font-medium rounded-md bg-secondary/80 text-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-border/50 cursor-pointer"
        >
          Previous
        </button>
        <div className="text-sm text-muted-foreground font-medium px-2">
          Page {currentPage} of {totalPages}
        </div>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-sm font-medium rounded-md bg-secondary/80 text-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-border/50 cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  );
}
