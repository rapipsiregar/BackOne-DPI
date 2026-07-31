"use client";

import { useState } from "react";
import { Shield } from "lucide-react";
import { Pagination } from "./Pagination";
import { UniversalFilters, useUniversalFilterState, FilterConfig } from "./UniversalFilters";

interface Props {
  threats: any[];
}

interface ColDef {
  header: string;
  width: string;
  align?: "center" | "right";
}

function TableWrap({ children, cols }: { children: React.ReactNode; cols: ColDef[] }) {
  return (
    <div className="rounded-xl border border-border/50 bg-[#090D16] overflow-x-auto overflow-y-auto max-h-[55vh] custom-scrollbar">
      <table className="w-full text-xs text-center table-fixed whitespace-nowrap min-w-[700px] border-collapse">
        <thead className="bg-[#111827] border-b border-border/80 sticky top-0 z-10">
          <tr className="bg-[#111827]">
            {cols.map((c) => (
              <th
                key={c.header}
                className={`px-3 py-2.5 font-medium text-muted-foreground uppercase tracking-wider text-[10px] text-center bg-[#111827] border-b border-border/80 ${c.width}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {children}
        </tbody>
      </table>
    </div>
  );
}

function Cell({ value, className = "", center = true, right = false }: { value: string | number; className?: string; center?: boolean; right?: boolean }) {
  const str = String(value ?? "—");
  const align = center ? "text-center" : right ? "text-right" : "text-center";
  return (
    <div className={`truncate overflow-hidden text-ellipsis flex items-center justify-center w-full ${align} ${className}`} title={str}>
      {str || "—"}
    </div>
  );
}

export default function DeviceThreatsTab({ threats = [] }: Props) {
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const { 
    filters,
    handleFilterChange,
    handleReset, activeCount 
  } = useUniversalFilterState();

  const opts = (key: string) => {
    const raw = Array.from(new Set(threats.map((r: any) => String(r[key] || "")).filter(Boolean)));
    return raw.sort();
  };

  const filterConfigs: FilterConfig[] = [
    { id: "severity", label: "Severity", type: "select", value: filters.severity, options: opts("severity") },
    { id: "threat_type", label: "Threat Type", type: "select", value: filters.threat_type, options: opts("threat_type") },
  ];

  const filteredData = threats.filter((row: any) => {
    if (filters.severity && filters.severity !== "All" && row.severity !== filters.severity) return false;
    if (filters.threat_type && filters.threat_type !== "All" && row.threat_type !== filters.threat_type) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginated = filteredData.slice(startIndex, startIndex + pageSize);

  if (threats.length === 0) {
    return (
      <div className="text-center py-12 bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl">
        <Shield className="w-14 h-14 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
        <h4 className="text-emerald-700 dark:text-emerald-400 font-bold text-lg mb-1">No Threats Detected</h4>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          This device's traffic appears secure. Keep in mind that new threat intelligence data may take a few moments to sync after a system restart.
        </p>
      </div>
    );
  }

  const COLS: ColDef[] = [
    { header: "#",         width: "w-[5%]", align: "center" },
    { header: "Time",      width: "w-[25%]", align: "center" },
    { header: "Type",      width: "w-[40%]", align: "center" },
    { header: "Severity",  width: "w-[15%]", align: "center" },
    { header: "Target IP", width: "w-[15%]", align: "center" },
  ];

  return (
    <div className="space-y-3">
      <UniversalFilters
        filters={filterConfigs}
        onChange={(id, val) => { handleFilterChange(id, val); setPage(1); }}
        showDateRange={false}
        activeFilterCount={activeCount}
        onReset={() => { handleReset(); setPage(1); }}
      />
      <TableWrap cols={COLS}>
        {paginated.map((t: any, i: number) => {
          const sev = (t.severity || '').toLowerCase();
          let badgeCls = "bg-slate-500/20 text-slate-300 ring-slate-500/30";
          if (sev === 'high' || sev === 'critical') badgeCls = "bg-red-500/20 text-red-400 ring-red-500/30";
          else if (sev === 'medium') badgeCls = "bg-amber-500/20 text-amber-400 ring-amber-500/30";
          else if (sev === 'low') badgeCls = "bg-blue-500/20 text-blue-400 ring-blue-500/30";
          const timeStr = t.detected_at ? new Date(t.detected_at).toLocaleString() : '-';
          return (
            <tr key={i} className="hover:bg-red-500/5 transition-colors duration-150">
              <td className="px-3 py-2.5"><Cell value={startIndex + i + 1} center /></td>
              <td className="px-3 py-2.5"><Cell value={timeStr} className="text-muted-foreground" center /></td>
              <td className="px-3 py-2.5">
                <div className="flex items-center justify-center w-full">
                  <div
                    title={t.description || t.threat_type || "-"}
                    className="font-semibold text-card-foreground text-xs truncate max-w-full cursor-help hover:text-primary transition-colors block text-center"
                  >
                    {t.threat_type || "-"}
                  </div>
                </div>
              </td>
              <td className="px-3 py-2.5 text-center">
                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold ring-1 ${badgeCls}`}>
                  {t.severity || "Unknown"}
                </span>
              </td>
              <td className="px-3 py-2.5"><Cell value={t.dst_ip || t.ip_address || "-"} className="font-mono text-muted-foreground" center /></td>
            </tr>
          );
        })}
      </TableWrap>
      {totalPages > 1 && (
        <div className="pt-2">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalResults={filteredData.length}
            startIndex={startIndex}
            endIndex={startIndex + pageSize}
          />
        </div>
      )}
    </div>
  );
}
