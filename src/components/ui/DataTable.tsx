"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Download, ChevronDown, FileText, FileSpreadsheet } from "lucide-react";
import { CsvExportOptions, downloadCsv } from "./DataTableCsvHelper";
import { DataTablePagination } from "./DataTablePagination";

export interface Column<T> {
  header: React.ReactNode;
  accessor: (row: T, index: number) => React.ReactNode;
  className?: string;
  sortable?: boolean;
  sortAccessor?: (row: T) => number | string | null | undefined;
  tooltip?: (row: T) => string;
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
  pdfExport?: { onExport: () => void; isExporting?: boolean; };
  onRowClick?: (row: T) => void;
  serverSide?: boolean;
  totalCount?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
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
  pdfExport,
  onRowClick,
  serverSide = false,
  totalCount = 0,
  currentPage = 1,
  onPageChange,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [localCurrentPage, setLocalCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: number; direction: 'asc' | 'desc' } | null>(null);

  const activePage = serverSide ? currentPage : localCurrentPage;
  const setActivePage = serverSide ? (onPageChange || (() => {})) : setLocalCurrentPage;

  const handleSort = (key: number) => {
    const direction = sortConfig?.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  let processedData = [...data];

  if (!serverSide && searchFilter && query.trim()) {
    processedData = processedData.filter(row => searchFilter(row, query.trim()));
  }

  if (!serverSide && sortConfig !== null) {
    const column = columns[sortConfig.key];
    if (column && column.sortable && column.sortAccessor) {
      processedData.sort((a, b) => {
        const valA = column.sortAccessor!(a), valB = column.sortAccessor!(b);
        if (valA === valB) return 0;
        if (valA == null) return 1;
        if (valB == null) return -1;
        const asc = sortConfig.direction === 'asc';
        return valA < valB ? (asc ? -1 : 1) : (asc ? 1 : -1);
      });
    }
  }

  const filteredData = processedData;

  const totalItems = serverSide ? totalCount : filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (activePage - 1) * pageSize;
  const paginatedData = serverSide ? filteredData : filteredData.slice(startIndex, startIndex + pageSize);

  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => exportRef.current && !exportRef.current.contains(e.target as Node) && setExportOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleCsvExport = () => {
    if (!csvExport) return;
    downloadCsv(csvExport.filename, [csvExport.headers, ...filteredData.map(csvExport.rowSerializer)]);
    setExportOpen(false);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {!serverSide && searchFilter && (
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActivePage(1);
              }}
              className="w-full max-w-sm rounded-lg border border-border bg-card/30 backdrop-blur-sm pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-card/50 transition-all shadow-sm"
            />
          </div>
        )}
        {(csvExport || pdfExport) && (
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen(prev => !prev)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/70 hover:text-emerald-300 transition-all shadow-sm whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Export ({totalItems})
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
            </button>
            {exportOpen && (
              <div className="absolute right-0 mt-1.5 w-44 rounded-xl border border-border/60 bg-slate-900/95 backdrop-blur-xl shadow-xl z-50 overflow-hidden">
                {csvExport && (
                  <button
                    onClick={handleCsvExport}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Export CSV
                  </button>
                )}
                {pdfExport && (
                  <button
                    onClick={() => { pdfExport.onExport(); setExportOpen(false); }}
                    disabled={pdfExport.isExporting}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-blue-400 hover:bg-blue-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileText className="w-4 h-4" />
                    {pdfExport.isExporting ? 'Generating...' : 'Export PDF'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-xl shadow-sm overflow-hidden">
        <div className="w-full max-h-[400px] overflow-y-auto custom-scrollbar [&::-webkit-scrollbar-track]:mt-[48px]">
          <table className="w-full text-sm text-center table-fixed">
            <thead className="bg-slate-900 text-muted-foreground border-b border-border/50 sticky top-0 z-20">
              <tr>
                {columns.map((col, i) => {
                  const hasWidth = col.className?.split(' ').some(c => c.startsWith('w-[') || c.startsWith('w-'));
                  const widthStyle = hasWidth ? undefined : { width: `${100 / columns.length}%` };
                  return (
                    <th 
                      key={i} 
                      onClick={() => col.sortable && handleSort(i)}
                      className={`px-4 py-3.5 h-[48px] font-medium tracking-wide text-center ${col.className || ""} ${col.sortable ? "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group select-none" : ""}`}
                      style={widthStyle}
                    >
                      <div className="flex items-center gap-1 justify-center">
                        {col.header}
                        {col.sortable && (
                          <div className="flex flex-col text-[10px] opacity-40 group-hover:opacity-100 transition-opacity">
                            <span className={`${sortConfig?.key === i && sortConfig.direction === 'asc' ? 'text-primary opacity-100' : ''}`}>▲</span>
                            <span className={`-mt-1 ${sortConfig?.key === i && sortConfig.direction === 'desc' ? 'text-primary opacity-100' : ''}`}>▼</span>
                          </div>
                        )}
                      </div>
                    </th>
                  );
                })}
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
                    {columns.map((col, j) => {
                      const hasWidth = col.className?.split(' ').some(c => c.startsWith('w-[') || c.startsWith('w-'));
                      const widthStyle = hasWidth ? undefined : { width: `${100 / columns.length}%` };
                      const content = col.accessor(row, (activePage - 1) * pageSize + i);
                      const tooltipText = col.tooltip
                        ? col.tooltip(row)
                        : (typeof content === 'string' || typeof content === 'number' ? String(content) : undefined);
                      return (
                        <td 
                          key={j} 
                          className={`px-2 py-3 h-[48px] max-h-[48px] overflow-hidden text-foreground text-center transition-colors ${col.className || ""}`}
                          style={widthStyle}
                          title={tooltipText}
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <DataTablePagination
          totalItems={totalItems}
          pageSize={pageSize}
          currentPage={activePage}
          totalPages={totalPages}
          onPageChange={setActivePage}
        />
      </div>
    </div>
  );
}
