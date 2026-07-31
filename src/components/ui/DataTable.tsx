"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Download, ChevronDown, FileText, FileSpreadsheet } from "lucide-react";
import { CsvExportOptions, downloadCsv } from "./DataTableCsvHelper";
import { DataTablePagination } from "./DataTablePagination";
import { DataTableMobileCards } from "./DataTableMobileCards";

import { DataTableDesktopView } from "./DataTableDesktopView";

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
      
      {/* Mobile Card View (< 768px) */}
      <DataTableMobileCards
        data={paginatedData}
        columns={columns}
        isLoading={isLoading}
        startIndex={startIndex}
        onRowClick={onRowClick}
        getRowClassName={getRowClassName}
      />

      {/* Desktop / Tablet Table View (>= 768px) */}
      <DataTableDesktopView
        data={paginatedData}
        columns={columns}
        isLoading={isLoading}
        activePage={activePage}
        pageSize={pageSize}
        sortConfig={sortConfig}
        onSort={handleSort}
        onRowClick={onRowClick}
        getRowClassName={getRowClassName}
      />

      <DataTablePagination
        totalItems={totalItems}
        pageSize={pageSize}
        currentPage={activePage}
        totalPages={totalPages}
        onPageChange={setActivePage}
      />
    </div>
  );
}
