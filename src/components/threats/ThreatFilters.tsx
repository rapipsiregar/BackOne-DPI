"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { ThreatStat } from "@/lib/api";
import { formatAppLabel } from "@/lib/utils";
import { DropdownFilterSelect } from "@/components/ui/DropdownFilterSelect";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { sortAppOptions } from "./sortAppOptions";

interface ThreatFiltersProps {
  all: ThreatStat[];
  fType: string;
  setFType: (v: string) => void;
  fSev: string;
  setFSev: (v: string) => void;
  fSrcIp: string;
  setFSrcIp: (v: string) => void;
  fDstIp: string;
  setFDstIp: (v: string) => void;
  fMac: string;
  setFMac: (v: string) => void;
  fApp: string;
  setFApp: (v: string) => void;
  fDomain: string;
  setFDomain: (v: string) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  activeFilterCount: number;
  onReset: () => void;
}

export function ThreatFilters({
  all,
  fType,
  setFType,
  fSev,
  setFSev,
  fSrcIp,
  setFSrcIp,
  fDstIp,
  setFDstIp,
  fMac,
  setFMac,
  fApp,
  setFApp,
  fDomain,
  setFDomain,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  activeFilterCount,
  onReset,
}: ThreatFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Derive unique options from data
  const opts = (key: keyof ThreatStat) => {
    const raw = Array.from(
      new Set(all.map((r) => String(r[key] || "")).filter(Boolean))
    );
    if (key === "app_label") {
      return sortAppOptions(raw);
    }
    return raw.sort();
  };

  // Earliest date for the calendar min
  const minDate = useMemo(() => {
    if (!all.length) return "2024-01-01";
    const dates = all
      .map((r) => (r.detected_at ? new Date(r.detected_at).getTime() : Infinity))
      .filter(isFinite);
    return dates.length
      ? new Date(Math.min(...dates)).toISOString().slice(0, 10)
      : "2024-01-01";
  }, [all]);

  return (
    <div className="mb-4">
      {/* Compact Trigger Button Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card/90 border border-border/70 hover:border-primary/50 text-xs font-semibold text-foreground transition-all shadow-sm active:scale-[0.98]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
            <span>Filter Threat Data</span>
            {activeFilterCount > 0 && (
              <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-[10px] font-bold">
                {activeFilterCount} active
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {fType && fType !== "All" && (
                <span className="text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-lg flex items-center gap-1">
                  Type: {fType}
                  <button onClick={() => setFType("All")}><X className="w-3 h-3" /></button>
                </span>
              )}
              {fSev && fSev !== "All" && (
                <span className="text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-lg flex items-center gap-1">
                  Severity: {fSev}
                  <button onClick={() => setFSev("All")}><X className="w-3 h-3" /></button>
                </span>
              )}
              {fApp && fApp !== "All" && (
                <span className="text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-lg flex items-center gap-1">
                  App: {formatAppLabel(fApp)}
                  <button onClick={() => setFApp("All")}><X className="w-3 h-3" /></button>
                </span>
              )}
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
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-overlay-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-card/95 border border-border/80 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-2xl animate-modal-in flex flex-col gap-5 max-h-[85vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                <h3 className="text-sm sm:text-base font-bold text-foreground">Filter Detected Threats</h3>
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

            {/* Modal Body Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  Date Range
                </label>
                <DateRangePicker
                  minDate={minDate}
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                  onChange={(f, t) => { setDateFrom(f); setDateTo(t); }}
                  onClear={() => { setDateFrom(""); setDateTo(""); }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Type</label>
                <DropdownFilterSelect value={fType} onChange={setFType} options={opts("threat_type")} placeholder="All Types" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Severity</label>
                <DropdownFilterSelect value={fSev} onChange={setFSev} options={opts("severity")} placeholder="All Severities" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Source IP</label>
                <DropdownFilterSelect value={fSrcIp} onChange={setFSrcIp} options={opts("ip_address")} placeholder="All Source IPs" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Dest IP</label>
                <DropdownFilterSelect value={fDstIp} onChange={setFDstIp} options={opts("dst_ip")} placeholder="All Dest IPs" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">MAC Address</label>
                <DropdownFilterSelect value={fMac} onChange={setFMac} options={opts("mac_address")} placeholder="All MACs" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">App</label>
                <DropdownFilterSelect value={fApp} onChange={setFApp} options={opts("app_label")} placeholder="All Apps" optionFormatter={formatAppLabel} />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Domain</label>
                <DropdownFilterSelect value={fDomain} onChange={setFDomain} options={opts("domain")} placeholder="All Domains" />
              </div>
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
