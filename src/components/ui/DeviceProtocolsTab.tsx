"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { fmtBytes, formatAppLabel } from "@/lib/utils";
import { Pagination } from "./Pagination";
import { UniversalFilters, useUniversalFilterState, FilterConfig } from "./UniversalFilters";

interface Props {
  protocols: any[];
  totalDownload: number;
  totalUpload: number;
}

export default function DeviceProtocolsTab({ protocols, totalDownload, totalUpload }: Props) {
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const { 
    filters,
    handleFilterChange,
    handleReset, activeCount 
  } = useUniversalFilterState();

  const opts = (key: string) => {
    const raw = Array.from(new Set(protocols.map((r: any) => String(r[key] || "")).filter(Boolean)));
    return raw.sort();
  };

  const filterConfigs: FilterConfig[] = [
    { id: "app_label", label: "Protocol", type: "select", value: filters.app_label, options: opts("app_label"), formatter: formatAppLabel },
    { id: "sort_download", label: "Sort Download", type: "select", value: filters.sort_download, options: ["Descending", "Ascending"] },
    { id: "sort_upload", label: "Sort Upload", type: "select", value: filters.sort_upload, options: ["Descending", "Ascending"] },
  ];

  const filteredData = protocols.filter((row: any) => {
    if (filters.app_label && filters.app_label !== "All" && row.app_label !== filters.app_label) return false;
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

  const totalBytes = totalDownload + totalUpload;

  if (protocols.length === 0) {
    return (
      <div className="text-center py-10 bg-slate-50/50 dark:bg-white/[0.02] border border-border rounded-2xl">
        <Link2 className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
        <h4 className="text-card-foreground font-bold text-lg mb-1">No Protocol Data</h4>
        <p className="text-muted-foreground font-medium max-w-md mx-auto">
          No distinct protocols or ports have been classified for this IP yet.
        </p>
      </div>
    );
  }

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginated.map((proto: any, i: number) => {
          const appBytes = proto.download + proto.upload;
          const pct = totalBytes > 0 ? ((appBytes / totalBytes) * 100).toFixed(1) : "0";
          return (
            <div key={i} className="bg-slate-50/50 dark:bg-white/[0.03] border border-border p-4 rounded-2xl hover:bg-slate-100/50 dark:hover:bg-white/[0.05] transition-colors group relative overflow-hidden text-xs">
              <div className="absolute top-0 left-0 h-1 bg-amber-500/30 transition-all duration-500" style={{ width: `${pct}%` }} />
              <h5 className="font-semibold text-card-foreground mb-3 text-sm flex justify-between items-center">
                {formatAppLabel(proto.app_label)}
                <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full ring-1 ring-purple-500/20">{pct}%</span>
              </h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Download</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-mono font-medium">{fmtBytes(proto.download)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Upload</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">{fmtBytes(proto.upload)}</span>
                </div>
                {proto.last_seen && (
                  <div className="flex justify-between mt-2 pt-2 border-t border-border/50">
                    <span className="text-muted-foreground">Last Seen</span>
                    <span className="text-muted-foreground font-medium">{new Date(proto.last_seen).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
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
