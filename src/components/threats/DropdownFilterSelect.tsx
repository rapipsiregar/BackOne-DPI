"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

interface DropdownFilterSelectProps {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder: string;
  optionFormatter?: (v: string) => string;
}

export function DropdownFilterSelect({
  value,
  options,
  onChange,
  placeholder,
  optionFormatter,
}: DropdownFilterSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = value !== "All";

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const displayValue = active
    ? optionFormatter
      ? optionFormatter(value)
      : value
    : placeholder;

  return (
    <div className="relative w-full" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center justify-between w-full px-3 py-2 text-xs rounded-lg border transition-all text-left outline-none ${
          active
            ? "border-primary/50 bg-primary/10 text-primary font-medium"
            : "border-border/50 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white"
        }`}
      >
        <span className="truncate">{displayValue}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-500 shrink-0 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Floating Pop-up with 0.5s transition animations (origin-top) */}
      <div
        className={`absolute top-full left-0 right-0 mt-1 max-h-[200px] overflow-y-auto bg-slate-900 border border-border/50 rounded-lg shadow-xl z-50 py-1 transition-all duration-500 ease-in-out origin-top ${
          open
            ? "opacity-100 scale-y-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-y-90 -translate-y-2 pointer-events-none"
        }`}
      >
        <button
          onClick={() => {
            onChange("All");
            setOpen(false);
          }}
          className={`w-full px-3 py-1.5 text-xs text-left transition-colors ${
            value === "All"
              ? "bg-primary/20 text-white font-medium"
              : "text-slate-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          All
        </button>
        {options.map((opt) => {
          const display = optionFormatter ? optionFormatter(opt) : opt;
          return (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`w-full px-3 py-1.5 text-xs text-left transition-colors truncate ${
                value === opt
                  ? "bg-primary/20 text-white font-medium"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
              title={display}
            >
              {display}
            </button>
          );
        })}
      </div>
    </div>
  );
}
