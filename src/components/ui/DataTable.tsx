"use client";

import { useState } from "react";
import { Search } from "lucide-react";

export interface Column<T> {
  header: React.ReactNode;
  accessor: (row: T, index: number) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  isLoading?: boolean;
  getRowClassName?: (row: T) => string;
  pageSize?: number;
}

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = "Search...",
  searchFilter,
  isLoading,
  getRowClassName,
  pageSize = 50
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = searchFilter
    ? data.filter(row => searchFilter(row, query.trim()))
    : data;

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-4 animate-fade-in">
      {searchFilter && (
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full max-w-sm rounded-lg border border-border bg-card/30 backdrop-blur-sm pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-card/50 transition-all shadow-sm"
          />
        </div>
      )}
      <div className="rounded-xl border border-border overflow-hidden bg-card/50 backdrop-blur-xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left table-fixed">
            <thead className="bg-secondary/30 text-muted-foreground border-b border-border/50">
              <tr>
                {columns.map((col, i) => (
                  <th key={i} className={`px-2 py-3.5 font-medium tracking-wide text-center ${col.className || ""}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-3 animate-pulse">
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
                        <svg className="animate-spin relative h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      <span className="text-sm font-medium tracking-wide">Loading data...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Search className="h-8 w-8 mb-3 opacity-20" />
                      <span className="text-sm font-medium">No data found</span>
                      {query && <span className="text-xs mt-1 opacity-70">Try adjusting your search query</span>}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, i) => (
                  <tr
                    key={i}
                    className={`h-[64px] hover:bg-primary/5 transition-colors duration-200 group ${getRowClassName ? getRowClassName(row) : ""}`}
                  >
                    {columns.map((col, j) => (
                      <td key={j} className={`px-2 py-3 text-center text-foreground group-hover:text-white transition-colors ${col.className || ""}`}>
                        {col.accessor(row, i)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredData.length > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-card/30">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-white">{startIndex + 1}</span> to{" "}
              <span className="font-medium text-white">
                {Math.min(startIndex + pageSize, filteredData.length)}
              </span>{" "}
              of <span className="font-medium text-white">{filteredData.length}</span> results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-secondary/80 text-white hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-border/50"
              >
                Previous
              </button>
              <div className="text-sm text-muted-foreground font-medium px-2">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-secondary/80 text-white hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-border/50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
