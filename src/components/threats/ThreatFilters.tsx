"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
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
    <Card className="bg-card/80 backdrop-blur-xl border-border/50 relative z-30 overflow-visible">
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
          {/* Date Range */}
          <div className="space-y-1.5 overflow-visible">
            <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
              Date Range
            </label>
            <DateRangePicker
              minDate={minDate}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onChange={(f, t) => {
                setDateFrom(f);
                setDateTo(t);
              }}
              onClear={() => {
                setDateFrom("");
                setDateTo("");
              }}
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5 overflow-visible">
            <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
              Type
            </label>
            <DropdownFilterSelect
              value={fType}
              onChange={setFType}
              options={opts("threat_type")}
              placeholder="All Types"
            />
          </div>

          {/* Severity */}
          <div className="space-y-1.5 overflow-visible">
            <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
              Severity
            </label>
            <DropdownFilterSelect
              value={fSev}
              onChange={setFSev}
              options={opts("severity")}
              placeholder="All Severities"
            />
          </div>

          {/* Source IP */}
          <div className="space-y-1.5 overflow-visible">
            <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
              Source IP
            </label>
            <DropdownFilterSelect
              value={fSrcIp}
              onChange={setFSrcIp}
              options={opts("ip_address")}
              placeholder="All Source IPs"
            />
          </div>

          {/* Dest IP */}
          <div className="space-y-1.5 overflow-visible">
            <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
              Dest IP
            </label>
            <DropdownFilterSelect
              value={fDstIp}
              onChange={setFDstIp}
              options={opts("dst_ip")}
              placeholder="All Dest IPs"
            />
          </div>

          {/* MAC */}
          <div className="space-y-1.5 overflow-visible">
            <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
              MAC Address
            </label>
            <DropdownFilterSelect
              value={fMac}
              onChange={setFMac}
              options={opts("mac_address")}
              placeholder="All MACs"
            />
          </div>

          {/* App */}
          <div className="space-y-1.5 overflow-visible">
            <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
              App
            </label>
            <DropdownFilterSelect
              value={fApp}
              onChange={setFApp}
              options={opts("app_label")}
              placeholder="All Apps"
              optionFormatter={formatAppLabel}
            />
          </div>

          {/* Domain */}
          <div className="space-y-1.5 overflow-visible">
            <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
              Domain
            </label>
            <DropdownFilterSelect
              value={fDomain}
              onChange={setFDomain}
              options={opts("domain")}
              placeholder="All Domains"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
