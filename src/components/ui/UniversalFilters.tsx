"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DropdownFilterSelect } from "./DropdownFilterSelect";
import { DateRangePicker } from "./DateRangePicker";

export interface FilterConfig {
  id: string;
  label: string;
  type: 'select' | 'date-range';
  value?: string;
  options?: string[]; // For select type
  placeholder?: string;
  formatter?: (val: string) => string; // For rendering option labels
}

export interface UniversalFiltersProps {
  filters: FilterConfig[];
  onChange: (id: string, value: string) => void;
  
  // Date range state
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
  
  if (filters.length === 0 && !showDateRange) return null;

  return (
    <Card className="bg-card/80 backdrop-blur-xl border-border/50 relative z-30 overflow-visible mb-6 animate-slide-up">
      <CardHeader className="border-b border-border/50 pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-semibold text-white uppercase tracking-wider">
            Filters
          </CardTitle>
          {activeFilterCount > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-semibold">
              {activeFilterCount} active
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={onReset}
            className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        )}
      </CardHeader>
      
      <CardContent className="p-4 overflow-visible">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 overflow-visible">
          {/* Optional Date Range */}
          {showDateRange && onDateChange && (
            <div className="space-y-1.5 overflow-visible">
              <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
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

          {/* Render mapped filters */}
          {filters.map((f) => {
            if (f.type === 'select') {
              return (
                <div key={f.id} className="space-y-1.5 overflow-visible">
                  <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
                    {f.label}
                  </label>
                  <DropdownFilterSelect
                    value={f.value || "All"}
                    onChange={(val) => onChange(f.id, val)}
                    options={f.options || []}
                    placeholder={f.placeholder || `All ${f.label}s`}
                    optionFormatter={f.formatter}
                  />
                </div>
              );
            }
            return null;
          })}
        </div>
      </CardContent>
    </Card>
  );
}

import { useState } from "react";

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
