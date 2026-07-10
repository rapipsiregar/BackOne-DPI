"use client";

import { useState } from "react";
import { Search, Download } from "lucide-react";

export interface Column<T> {
  header: React.ReactNode;
  accessor: (row: T, index: number) => React.ReactNode;
  className?: string;
  sortable?: boolean;
  sortAccessor?: (row: T) => number | string | null | undefined;
}

export interface CsvExportOptions<T> {
  filename: string;
  headers: string[];
  rowSerializer: (row: T) => (string | number | null | undefined)[];
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  isLoading?: boolean;
  getRowClassName?: (row: T) => string;
  pageSize?: number;
  csvExport?: CsvExportOptions<T>;
  onRowClick?: (row: T) => void;
}

function escapeCsvCell(val: string | number | null | undefined): string {
  const str = val == null ? "" : String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]): void {
  const bom = "\uFEFF";
  const csv = bom + rows.map(row => row.map(escapeCsvCell).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = "Search...",
  searchFilter,
  isLoading,
  getRowClassName,
  pageSize = 50,
  csvExport,
  onRowClick,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: number; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (columnIndex: number) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === columnIndex && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: columnIndex, direction });
  };

  let processedData = [...data];

  if (searchFilter && query.trim()) {
    processedData = processedData.filter(row => searchFilter(row, query.trim()));
  }

  if (sortConfig !== null) {
    const column = columns[sortConfig.key];
    if (column && column.sortable && column.sortAccessor) {
      processedData.sort((a, b) => {
        const valA = column.sortAccessor!(a);
        const valB = column.sortAccessor!(b);
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
  }

  const filteredData = processedData;

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  const handleCsvExport = () => {
    if (!csvExport) return;
    const rows = [
      csvExport.headers,
      ...filteredData.map(row => csvExport.rowSerializer(row)),
    ];
    downloadCsv(csvExport.filename, rows);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
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
        {csvExport && (
          <button
            onClick={handleCsvExport}
            title={`Export ${filteredData.length} rows to CSV`}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/70 hover:text-emerald-300 transition-all shadow-sm whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Export CSV ({filteredData.length})
          </button>
        )}
      </div>
      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-xl shadow-sm overflow-visible">
        <div className="w-full overflow-visible">
          <table className="w-full text-sm text-left table-fixed">
            <thead className="bg-secondary/30 text-muted-foreground border-b border-border/50 relative z-20">
              <tr>
                {columns.map((col, i) => (
                  <th 
                    key={i} 
                    onClick={() => col.sortable && handleSort(i)}
                    className={`px-4 py-3.5 h-[48px] font-medium tracking-wide whitespace-nowrap ${col.className?.includes("text-") ? "" : "text-center"} ${col.className || ""} ${col.sortable ? "cursor-pointer hover:bg-white/5 transition-colors group select-none" : ""}`}
                  >
                    <div className={`flex items-center gap-1 ${col.className?.includes("text-") && !col.className?.includes("text-center") ? "" : "justify-center"}`}>
                      {col.header}
                      {col.sortable && (
                        <div className="flex flex-col text-[10px] opacity-40 group-hover:opacity-100 transition-opacity">
                          <span className={`${sortConfig?.key === i && sortConfig.direction === 'asc' ? 'text-primary opacity-100' : ''}`}>▲</span>
                          <span className={`-mt-1 ${sortConfig?.key === i && sortConfig.direction === 'desc' ? 'text-primary opacity-100' : ''}`}>▼</span>
                        </div>
                      )}
                    </div>
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
                    onClick={() => onRowClick?.(row)}
                    className={`hover:bg-primary/5 border-b border-border/50 transition-colors duration-200 group h-[48px] ${onRowClick ? "cursor-pointer hover:bg-primary/10" : ""} ${getRowClassName ? getRowClassName(row) : ""}`}
                  >
                    {columns.map((col, j) => (
                      <td key={j} className={`px-2 py-3 h-[48px] max-h-[48px] overflow-hidden text-foreground group-hover:text-white transition-colors truncate whitespace-nowrap ${col.className?.includes("text-") ? "" : "text-center"} ${col.className || ""}`}>
                        {col.accessor(row, i)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
