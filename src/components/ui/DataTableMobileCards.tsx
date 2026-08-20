"use client";

import { useMemo } from "react";
import { Column } from "./DataTable";
import { cn } from "@/lib/utils";

interface DataTableMobileCardsProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  startIndex: number;
  onRowClick?: (row: T) => void;
  getRowClassName?: (row: T) => string;
}

export function DataTableMobileCards<T>({
  data,
  columns,
  isLoading,
  startIndex,
  onRowClick,
  getRowClassName,
}: DataTableMobileCardsProps<T>) {
  // Main title column (IP, Name, Label, App)
  const mainHeader = useMemo(() => {
    return (
      columns.find((c) => {
        const h = String(c.header || "").toLowerCase();
        return (
          h.includes("ip") ||
          h.includes("agent") ||
          h.includes("app") ||
          h.includes("label") ||
          h.includes("name")
        );
      }) ||
      columns[1] ||
      columns[0]
    );
  }, [columns]);

  // Status / Severity / Risk badge column to pin to top right
  const statusHeader = useMemo(() => {
    return columns.find((c) => {
      const h = String(c.header || "").toLowerCase();
      return (
        h.includes("status") ||
        h.includes("state") ||
        h.includes("risk") ||
        h.includes("severity") ||
        h.includes("level")
      );
    });
  }, [columns]);

  if (isLoading) {
    return (
      <div className="md:hidden p-6 text-center text-slate-400 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse text-xs">
        Loading data...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="md:hidden p-6 text-center text-slate-400 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs font-medium">
        No data found
      </div>
    );
  }

  return (
    <div className="md:hidden space-y-3.5 touch-pan-y pb-20">
      {data.map((row, i) => {
        const rowIndex = startIndex + i;

        return (
          <div
            key={i}
            onClick={() => onRowClick?.(row)}
            className={cn(
              "bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3 shadow-lg backdrop-blur-md hover:border-blue-500/30 active:bg-slate-800/60 transition-all duration-150 touch-pan-y",
              onRowClick && "cursor-pointer active:scale-[0.99]",
              getRowClassName ? getRowClassName(row) : ""
            )}
          >
            {/* Header Row: Index + Primary Title on Left, Status Badge on Right */}
            <div className="flex items-center justify-between border-b border-slate-800/70 pb-3 gap-2.5 min-w-0">
              <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
                <span className="text-[10px] font-bold text-slate-300 font-mono shrink-0 bg-slate-800/90 px-2 py-0.5 rounded-md border border-slate-700/60 shadow-sm">
                  #{rowIndex + 1}
                </span>
                <div className="text-sm font-bold text-blue-400 truncate tracking-tight">
                  {mainHeader ? mainHeader.accessor(row, rowIndex) : null}
                </div>
              </div>
              {statusHeader && (
                <div className="shrink-0 text-xs font-medium">
                  {statusHeader.accessor(row, rowIndex)}
                </div>
              )}
            </div>

            {/* Structured Card Grid Items */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-3 text-xs">
              {columns.map((col, j) => {
                if (col === mainHeader || col === statusHeader) return null;
                const headerText =
                  typeof col.header === "string" || typeof col.header === "number"
                    ? String(col.header)
                    : "";
                if (headerText === "#" || headerText.trim() === "#") return null;

                const val = col.accessor(row, rowIndex);
                if (val == null || val === "-") return null;

                const lowerH = headerText.toLowerCase();
                const isFullWidth =
                  lowerH.includes("mac") ||
                  lowerH.includes("flow id") ||
                  lowerH.includes("domain") ||
                  lowerH.includes("url") ||
                  lowerH.includes("action") ||
                  lowerH.includes("mitigation") ||
                  lowerH.includes("description") ||
                  lowerH.includes("device") ||
                  lowerH.includes("vendor") ||
                  lowerH.includes("manufacturer") ||
                  lowerH.includes("agent") ||
                  lowerH.includes("probe");

                const tooltip = col.tooltip ? col.tooltip(row) : undefined;

                if (isFullWidth) {
                  return (
                    <div
                      key={j}
                      className="col-span-2 flex flex-col min-w-0 bg-slate-950/60 border border-slate-800/60 rounded-xl p-2.5"
                      title={tooltip}
                    >
                      {headerText && (
                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                          {headerText}
                        </div>
                      )}
                      <div className="text-slate-200 font-medium break-all leading-relaxed">
                        {val}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={j}
                    className="col-span-1 flex flex-col min-w-0 justify-center bg-slate-950/30 border border-slate-800/40 rounded-xl p-2.5"
                    title={tooltip}
                  >
                    {headerText && (
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider truncate mb-1">
                        {headerText}
                      </div>
                    )}
                    <div className="text-slate-200 font-medium min-w-0 overflow-hidden text-ellipsis leading-tight">
                      {val}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
