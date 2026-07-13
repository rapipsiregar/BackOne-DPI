"use client";

import { useState } from "react";
import { Monitor, ChevronRight } from "lucide-react";
import { fmtBytes } from "@/lib/utils";
import { Pagination } from "./Pagination";
import { UniversalFilters, useUniversalFilterState, FilterConfig } from "./UniversalFilters";

interface Props {
  devices: any[];
  onSelectDevice: (device: { ip: string; label: string | null; mac: string | null }) => void;
}

function riskStyle(level: string | null) {
  switch ((level || "").toLowerCase()) {
    case "vulnerable":
    case "critical": return { badge: "bg-red-500/15 text-red-400 ring-red-500/30", dot: "bg-red-400" };
    case "moderate":
    case "medium":   return { badge: "bg-yellow-500/15 text-yellow-400 ring-yellow-500/30", dot: "bg-yellow-400" };
    case "safe":
    case "low":      return { badge: "bg-green-500/15 text-green-400 ring-green-500/30", dot: "bg-green-400" };
    default:         return { badge: "bg-slate-500/15 text-muted-foreground ring-slate-500/30", dot: "bg-slate-400" };
  }
}

export default function AgentDevicesTab({ devices, onSelectDevice }: Props) {
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const { 
    filters,
    handleFilterChange,
    handleReset, activeCount 
  } = useUniversalFilterState();

  const opts = (key: string) => {
    const raw = Array.from(new Set(devices.map((r: any) => String(r[key] || "")).filter(Boolean)));
    return raw.sort();
  };

  const filterConfigs: FilterConfig[] = [
    { id: "device_type", label: "Device Type", type: "select", value: filters.device_type, options: opts("device_type") },
    { id: "os_label", label: "OS", type: "select", value: filters.os_label, options: opts("os_label") },
    { id: "manufacturer", label: "Manufacturer", type: "select", value: filters.manufacturer, options: opts("manufacturer") },
    { id: "risk_level", label: "Risk", type: "select", value: filters.risk_level, options: opts("risk_level") },
    { id: "sort_download", label: "Sort Download", type: "select", value: filters.sort_download, options: ["Descending", "Ascending"] },
    { id: "sort_upload", label: "Sort Upload", type: "select", value: filters.sort_upload, options: ["Descending", "Ascending"] },
  ];

  const filteredData = devices.filter((row: any) => {
    if (filters.device_type && filters.device_type !== "All" && row.device_type !== filters.device_type) return false;
    if (filters.os_label && filters.os_label !== "All" && row.os_label !== filters.os_label) return false;
    if (filters.manufacturer && filters.manufacturer !== "All" && row.manufacturer !== filters.manufacturer) return false;
    if (filters.risk_level && filters.risk_level !== "All" && row.risk_level !== filters.risk_level) return false;
    return true;
  });

  let processedData = [...filteredData];
  const sortUpload = filters.sort_upload || "All";
  const sortDownload = filters.sort_download || "All";
  
  if (sortUpload !== "All") {
    processedData.sort((a, b) => sortUpload === "Descending" ? b.upload - a.upload : a.upload - b.upload);
  } else if (sortDownload !== "All") {
    processedData.sort((a, b) => sortDownload === "Descending" ? b.download - a.download : a.download - b.download);
  }

  const totalPages = Math.ceil(processedData.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginated = processedData.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-3">
      <UniversalFilters
        filters={filterConfigs}
        onChange={(id, val) => {
          if (id === 'sort_download') {
            handleFilterChange('sort_download', val);
            handleFilterChange('sort_upload', 'All');
          } else if (id === 'sort_upload') {
            handleFilterChange('sort_upload', val);
            handleFilterChange('sort_download', 'All');
          } else {
            handleFilterChange(id, val);
          }
          setPage(1);
        }}
        showDateRange={false}
        activeFilterCount={activeCount}
        onReset={() => { handleReset(); setPage(1); }}
      />
      <div className="space-y-2">
        {paginated.map((d, i) => {
          const rc = riskStyle(d.risk_level);
          return (
            <button
              key={i}
              onClick={() => onSelectDevice({ ip: d.ip_address || "", label: d.device_label, mac: d.mac_address })}
              className="w-full text-left p-3 bg-white/[0.03] hover:bg-white/[0.07] hover:border-cyan-500/30 border border-border/50 rounded-xl transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 p-2 bg-slate-800/60 group-hover:bg-cyan-500/10 rounded-lg transition-colors">
                  <Monitor className="w-4 h-4 text-muted-foreground group-hover:text-cyan-400 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-card-foreground text-sm truncate group-hover:text-cyan-300 transition-colors" title={d.device_label || d.ip_address || "Unknown"}>
                      {d.device_label || d.ip_address || "Unknown"}
                    </p>
                    {d.risk_level && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${rc.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />
                        {d.risk_level}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <p className="text-xs text-muted-foreground font-mono">{d.ip_address}</p>
                    {d.device_type && (
                      <p className="text-xs font-semibold text-slate-300">
                        {d.device_type}
                      </p>
                    )}
                    {d.os_label && <p className="text-xs text-blue-400">{d.os_label}</p>}
                    {d.mac_address && <p className="text-xs text-muted-foreground font-mono">{d.mac_address}</p>}
                    {d.manufacturer && <p className="text-xs text-muted-foreground">{d.manufacturer}</p>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 space-y-1 min-w-[110px]">
                  <p className="text-xs text-cyan-400 flex items-center justify-end gap-1">
                    <span className="text-[10px] text-muted-foreground">DL:</span> {fmtBytes(d.download ?? 0)}
                  </p>
                  <p className="text-xs text-green-400 flex items-center justify-end gap-1">
                    <span className="text-[10px] text-muted-foreground">UL:</span> {fmtBytes(d.upload ?? 0)}
                  </p>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 ml-auto transition-colors mt-0.5" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalResults={processedData.length}
          startIndex={startIndex}
          endIndex={startIndex + pageSize}
        />
      )}
    </div>
  );
}
