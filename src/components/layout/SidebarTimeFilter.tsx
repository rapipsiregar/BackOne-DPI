"use client";

import React from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeOption {
  readonly value: "5m" | "30m" | "1h" | "1d" | "7d";
  readonly label: string;
}

interface SidebarTimeFilterProps {
  timeRange: string;
  setTimeRange: (range: any) => void;
  isTimeDropdownOpen: boolean;
  setIsTimeDropdownOpen: (open: boolean) => void;
  timeDropdownRef: React.RefObject<HTMLDivElement | null>;
  selectedTimeOption: TimeOption;
  timeOptions: readonly TimeOption[];
}

export function SidebarTimeFilter({
  timeRange,
  setTimeRange,
  isTimeDropdownOpen,
  setIsTimeDropdownOpen,
  timeDropdownRef,
  selectedTimeOption,
  timeOptions,
}: SidebarTimeFilterProps) {
  return (
    <div className="relative w-full px-2 pb-2" ref={timeDropdownRef}>
      <button
        onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] p-2.5 text-xs text-slate-300 transition-colors"
      >
        <div className="flex items-center gap-2 truncate">
          <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
          <div className="flex flex-col items-start truncate leading-normal">
            <span className="font-semibold text-[10px] text-primary uppercase tracking-wider">Time Filter</span>
            <span className="truncate max-w-[130px]">{selectedTimeOption.label}</span>
          </div>
        </div>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-300", isTimeDropdownOpen && "rotate-180")} />
      </button>

      <div
        className={cn(
          "absolute top-full left-2 right-2 mt-1 rounded-xl border border-white/10 bg-slate-950 p-1.5 shadow-2xl z-50 origin-top transition-all duration-300 ease-out",
          isTimeDropdownOpen
            ? "opacity-100 scale-100 pointer-events-auto translate-y-0"
            : "opacity-0 scale-95 pointer-events-none -translate-y-2"
        )}
      >
        <div className="flex flex-col gap-0.5 max-h-60 overflow-y-auto custom-scrollbar">
          {timeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setTimeRange(opt.value);
                setIsTimeDropdownOpen(false);
              }}
              className={cn(
                "w-full rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors",
                timeRange === opt.value
                  ? "bg-primary/20 text-white font-medium"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
