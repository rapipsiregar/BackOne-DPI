"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { DropdownFilterSelect } from "./DropdownFilterSelect";
import { DateRangePicker } from "./DateRangePicker";

export interface FilterConfig {
  id: string;
  label: string;
  type: 'select' | 'date-range';
  value?: string;
  options?: string[];
  placeholder?: string;
  formatter?: (val: string) => string;
}

export interface UniversalFiltersProps {
  filters: FilterConfig[];
  onChange: (id: string, value: string) => void;
  showDateRange?: boolean;
  dateFrom?: string;
  dateTo?: string;
  minDate?: string;
  onDateChange?: (from: string, to: string) => void;
  activeFilterCount: number;
  onReset: () => void;
}

export function UniversalFilters({
  filters,
  onChange,
  showDateRange = false,
  dateFrom = "",
  dateTo = "",
  minDate = "2024-01-01",
  onDateChange,
  activeFilterCount,
  onReset,
}: UniversalFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (filters.length === 0 && !showDateRange) return null;

  return (
    <div className="mb-4">
      {/* Compact Filter Trigger Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card/90 border border-border/70 hover:border-primary/50 text-xs font-semibold text-foreground transition-all shadow-sm active:scale-[0.98]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
            <span>Filter Data</span>
            {activeFilterCount > 0 && (
              <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-[10px] font-bold">
                {activeFilterCount} active
              </span>
            )}
          </button>

          {/* Active Filter Chips summary */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {filters.map((f) => {
                if (f.value && f.value !== "All") {
                  return (
                    <span
                      key={f.id}
                      className="text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-lg flex items-center gap-1"
                    >
                      {f.label}: {f.formatter ? f.formatter(f.value) : f.value}
                      <button
                        onClick={() => onChange(f.id, "All")}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>

        {activeFilterCount > 0 && (
          <button
            onClick={onReset}
            className="text-[11px] font-semibold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-500/10"
          >
            <X className="w-3 h-3" />
            Reset All
          </button>
        )}
      </div>

      {/* Pop-up Filter Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-overlay-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-card/95 border border-border/80 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-2xl animate-modal-in flex flex-col gap-5 max-h-[85vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                <h3 className="text-sm sm:text-base font-bold text-foreground">Filter Telemetry Data</h3>
                {activeFilterCount > 0 && (
                  <span className="text-xs bg-primary/20 text-primary px-2.5 py-0.5 rounded-full font-bold">
                    {activeFilterCount} Active
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {showDateRange && onDateChange && (
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                    Date Range
                  </label>
                  <DateRangePicker
                    minDate={minDate}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    onChange={onDateChange}
                    onClear={() => onDateChange("", "")}
                  />
                </div>
              )}

              {filters.map((f) => {
                if (f.type === 'select') {
                  return (
                    <div key={f.id} className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                        {f.label}
                      </label>
                      <DropdownFilterSelect
                        value={f.value || "All"}
                        onChange={(val) => onChange(f.id, val)}
                        options={f.options || []}
                        placeholder={
                          f.placeholder ||
                          (f.label.toLowerCase().endsWith('y')
                            ? `All ${f.label.slice(0, -1)}ies`
                            : `All ${f.label}s`)
                        }
                        optionFormatter={f.formatter}
                      />
                    </div>
                  );
                }
                return null;
              })}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-2">
              {activeFilterCount > 0 ? (
                <button
                  onClick={onReset}
                  className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  Reset All Filters
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function useUniversalFilterState() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const handleFilterChange = (id: string, val: string) => {
    setFilters(prev => ({ ...prev, [id]: val }));
  };

  const handleReset = () => {
    setFilters({});
    setDateFrom("");
    setDateTo("");
  };

  const activeCount = Object.values(filters).filter(v => v && v !== "All").length + (dateFrom || dateTo ? 1 : 0);

  return { filters, dateFrom, dateTo, handleFilterChange, setDateFrom, setDateTo, handleReset, activeCount };
}
