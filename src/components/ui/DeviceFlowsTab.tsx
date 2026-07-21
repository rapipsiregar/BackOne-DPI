"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import { fmtBytes, formatAppLabel } from "@/lib/utils";
import { Pagination } from "./Pagination";
import { UniversalFilters, useUniversalFilterState, FilterConfig } from "./UniversalFilters";

interface Props {
  flows: any[];
  ip: string;
}

interface ColDef {
  header: string;
  width: string;
  align?: "center" | "right";
}

function TableWrap({ children, cols }: { children: React.ReactNode; cols: ColDef[] }) {
  return (
    <div className="overflow-x-auto overflow-y-auto max-h-[60vh] rounded-xl border border-border/50 bg-secondary/10 custom-scrollbar">
      <table className="w-full text-xs text-center table-fixed whitespace-nowrap min-w-[800px]">
        <thead className="sticky top-0 bg-[#111827] z-10">
          <tr className="border-b border-border">
            {cols.map((c) => (
              <th
                key={c.header}
                className={`px-3 py-2.5 font-medium text-muted-foreground uppercase tracking-wider text-[10px] text-center ${c.width}`}
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

export default function DeviceFlowsTab({ flows, ip }: Props) {
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const { 
    filters,
    handleFilterChange,
    handleReset, activeCount 
  } = useUniversalFilterState();

  const opts = (key: string) => {
    const raw = Array.from(new Set(flows.map((r: any) => String(r[key] || "")).filter(Boolean)));
    return raw.sort();
  };

  const filterConfigs: FilterConfig[] = [
    { id: "app_name", label: "App", type: "select", value: filters.app_name, options: opts("app_name"), formatter: formatAppLabel },
    { id: "protocol_name", label: "Protocol", type: "select", value: filters.protocol_name, options: opts("protocol_name"), formatter: formatAppLabel },
  ];

  const filteredData = flows.filter((row: any) => {
    if (filters.app_name && filters.app_name !== "All" && row.app_name !== filters.app_name) return false;
    if (filters.protocol_name && filters.protocol_name !== "All" && row.protocol_name !== filters.protocol_name) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginated = filteredData.slice(startIndex, startIndex + pageSize);

  if (flows.length === 0) {
    return (
      <div className="text-center py-10 bg-slate-50/50 dark:bg-white/[0.02] border border-border rounded-2xl">
        <Activity className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
        <h4 className="text-card-foreground font-bold text-lg mb-1">No Flow Data Yet</h4>
        <p className="text-muted-foreground font-medium max-w-md mx-auto">
          Network flows for this IP haven't been captured or are currently being ingested. If you just started the system, please wait a few moments as data is actively being synchronized.
        </p>
      </div>
    );
  }

  const COLS: ColDef[] = [
    { header: "#",              width: "w-[5%]", align: "center" },
    { header: "Time",           width: "w-[15%]", align: "center" },
    { header: "Source",         width: "w-[15%]", align: "center" },
    { header: "Destination",    width: "w-[15%]", align: "center" },
    { header: "Port",           width: "w-[10%]", align: "center" },
    { header: "App / Protocol", width: "w-[20%]", align: "center" },
    { header: "Download",       width: "w-[10%]", align: "center" },
    { header: "Upload",         width: "w-[10%]", align: "center" },
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
        {paginated.map((f: any, i: number) => {
          const isOutbound = f.src_ip === ip;
          const timeStr = f.last_seen ? new Date(f.last_seen).toLocaleString() : '-';
          return (
            <tr key={i} className="hover:bg-white/[0.04] transition-colors duration-150">
              <td className="px-3 py-2.5"><Cell value={startIndex + i + 1} center /></td>
              <td className="px-3 py-2.5"><Cell value={timeStr} className="text-muted-foreground" center /></td>
              <td className="px-3 py-2.5">
                <Cell value={f.src_ip} className={`font-mono ${isOutbound ? 'text-blue-400 font-semibold' : 'text-slate-400'}`} />
              </td>
              <td className="px-3 py-2.5">
                <Cell value={f.dst_ip} className={`font-mono ${!isOutbound ? 'text-blue-400 font-semibold' : 'text-slate-400'}`} />
              </td>
              <td className="px-3 py-2.5">
                <Cell value={f.dst_port || '-'} className="text-amber-400/80 font-mono" center />
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center justify-center w-full">
                  <span className="bg-white/10 text-slate-200 px-2 py-0.5 rounded text-[10px] font-medium border border-white/5 truncate max-w-full inline-block align-middle" title={f.app_label || f.protocol || '-'}>
                    {f.app_label || f.protocol || '-'}
                  </span>
                </div>
              </td>
              <td className="px-3 py-2.5"><Cell value={fmtBytes(f.download)} className="text-cyan-400 font-mono" center /></td>
              <td className="px-3 py-2.5"><Cell value={fmtBytes(f.upload)} className="text-emerald-400 font-mono" center /></td>
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
