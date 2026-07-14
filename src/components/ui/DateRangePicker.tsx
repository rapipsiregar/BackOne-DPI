"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Calendar, X } from "lucide-react";

interface DateRangePickerProps {
  minDate: string;
  dateFrom: string;
  dateTo: string;
  onChange: (from: string, to: string) => void;
  onClear: () => void;
}

export function DateRangePicker({
  minDate,
  dateFrom,
  dateTo,
  onChange,
  onClear,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const today = new Date().toISOString().slice(0, 10);
  const active = !!(dateFrom || dateTo);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center justify-between w-full px-3 py-2 text-xs rounded-lg border transition-all outline-none ${
          active
            ? "border-primary/50 bg-primary/10 text-primary font-medium"
            : "border-border/50 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white"
        }`}
        title="Filter by date"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5" />
          <span className="truncate">
            {active ? `${dateFrom || "..."} to ${dateTo || "..."}` : "Filter Date"}
          </span>
        </div>
        {active ? (
          <X
            className="w-3.5 h-3.5 cursor-pointer hover:text-red-400"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
              setOpen(false);
            }}
          />
        ) : (
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-500 shrink-0 ${
              open ? "rotate-180" : ""
            }`}
          />
        )}
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-border/50 rounded-xl shadow-2xl z-50 p-4 min-w-[260px]">
          <p className="text-xs text-muted-foreground mb-3 font-medium">
            Filter by Date Range
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">
                From
              </label>
              <input
                type="date"
                min={minDate}
                max={dateTo || today}
                value={dateFrom}
                onChange={(e) => onChange(e.target.value, dateTo)}
                className="w-full bg-slate-800 border border-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">
                To
              </label>
              <input
                type="date"
                min={dateFrom || minDate}
                max={today}
                value={dateTo}
                onChange={(e) => onChange(dateFrom, e.target.value)}
                className="w-full bg-slate-800 border border-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                onChange(today, today);
                setOpen(false);
              }}
              className="flex-1 px-2 py-1.5 text-xs bg-primary/10 text-primary border border-primary/30 rounded-lg hover:bg-primary/20 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() - 6);
                onChange(d.toISOString().slice(0, 10), today);
                setOpen(false);
              }}
              className="flex-1 px-2 py-1.5 text-xs bg-secondary/50 text-white border border-border/50 rounded-lg hover:bg-secondary transition-colors"
            >
              7 Days
            </button>
            <button
              onClick={() => {
                onClear();
                setOpen(false);
              }}
              className="px-2 py-1.5 text-xs bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
