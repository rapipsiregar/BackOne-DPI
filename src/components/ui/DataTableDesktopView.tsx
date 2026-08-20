"use client";

import { Column } from "./DataTable";
import { Search } from "lucide-react";

interface DataTableDesktopViewProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  activePage: number;
  pageSize: number;
  sortConfig: { key: number; direction: 'asc' | 'desc' } | null;
  onSort: (key: number) => void;
  onRowClick?: (row: T) => void;
  getRowClassName?: (row: T) => string;
}

export function DataTableDesktopView<T>({
  data,
  columns,
  isLoading,
  activePage,
  pageSize,
  sortConfig,
  onSort,
  onRowClick,
  getRowClassName,
}: DataTableDesktopViewProps<T>) {
  return (
    <div className="hidden md:block rounded-xl border border-border bg-[#0B0F19] shadow-sm overflow-hidden overflow-x-auto">
      <table className="w-full text-sm text-center table-fixed border-collapse">
        <thead className="bg-slate-900 border-b border-border/80">
          <tr className="bg-slate-900">
            {columns.map((col, i) => {
              const hasWidth = col.className?.split(' ').some(c => c.startsWith('w-[') || c.startsWith('w-'));
              const widthStyle = hasWidth ? undefined : { width: `${100 / columns.length}%` };
              return (
                <th 
                  key={i} 
                  onClick={() => col.sortable && onSort(i)}
                  className={`px-4 py-3.5 h-[48px] font-semibold text-xs tracking-wider text-slate-300 bg-slate-900 border-b border-border/80 text-center ${col.className || ""} ${col.sortable ? "cursor-pointer hover:bg-slate-800/80 transition-colors group select-none" : ""}`}
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
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Search className="h-8 w-8 mb-3 opacity-20" />
                  <span className="text-sm font-medium">No data found</span>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
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
  );
}
