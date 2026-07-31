"use client";

import { useState } from "react";
import { fmtBytes, formatAppLabel } from "@/lib/utils";
import { IpDetails } from "./IpDetails";
import { Pagination } from "./Pagination";
import { UniversalFilters, useUniversalFilterState, FilterConfig } from "./UniversalFilters";

interface ColDef {
  header: string;
  width: string;
  align?: "center" | "right";
}

function TableWrap({ children, cols }: { children: React.ReactNode; cols: ColDef[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/50 bg-secondary/10 custom-scrollbar touch-pan-y">
      <table className="w-full text-xs text-center table-fixed whitespace-nowrap min-w-[800px]">
        <thead>
          <tr className="border-b border-border bg-muted/50">
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

// ─── Cell with overflow ellipsis + title tooltip ────────────────────────────────
function Cell({ value, className = "", center = true, right = false }: { value: string | number; className?: string; center?: boolean; right?: boolean }) {
  const str = String(value ?? "—");
  const align = center ? "text-center" : right ? "text-right" : "text-center";
  return (
    <div className={`truncate overflow-hidden text-ellipsis flex items-center justify-center w-full ${align} ${className}`} title={str}>
      {str || "—"}
    </div>
  );
}

interface Props {
  flows: any[];
}

export default function AgentFlowsTab({ flows }: Props) {
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
    { id: "app_label", label: "App", type: "select", value: filters.app_label, options: opts("app_label"), formatter: formatAppLabel },
    { id: "protocol", label: "Protocol", type: "select", value: filters.protocol, options: opts("protocol"), formatter: formatAppLabel },
    { id: "sort_download", label: "Sort Download", type: "select", value: filters.sort_download, options: ["Descending", "Ascending"] },
    { id: "sort_upload", label: "Sort Upload", type: "select", value: filters.sort_upload, options: ["Descending", "Ascending"] },
  ];

  const filteredData = flows.filter((row: any) => {
    if (filters.app_label && filters.app_label !== "All" && row.app_label !== filters.app_label) return false;
    if (filters.protocol && filters.protocol !== "All" && row.protocol !== filters.protocol) return false;
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

  const COLS: ColDef[] = [
    { header: "#",            width: "w-[5%]", align: "center" },
    { header: "Source IP",    width: "w-[15%]", align: "center" },
    { header: "Destination",  width: "w-[15%]", align: "center" },
    { header: "App / Domain", width: "w-[20%]", align: "center" },
    { header: "Protocol",     width: "w-[10%]", align: "center" },
    { header: "Download",     width: "w-[10%]", align: "center" },
    { header: "Upload",       width: "w-[10%]", align: "center" },
    { header: "Last Seen",    width: "w-[15%]", align: "center" },
  ];

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
      <TableWrap cols={COLS}>
        {paginated.map((f, i) => (
          <tr key={i} className="hover:bg-white/[0.04] transition-colors duration-150">
            <td className="px-3 py-2.5"><Cell value={startIndex + i + 1} center /></td>
            <td className="px-3 py-2.5"><Cell value={f.src_ip || "—"} className="font-mono text-blue-400" center /></td>
            <td className="px-3 py-2.5">
              <div className="flex flex-col items-center justify-center gap-0.5 truncate w-full">
                <div className="font-mono text-slate-300 truncate text-center" title={`${f.dst_ip || "—"}${f.dst_port ? ':' + f.dst_port : ''}`}>
                  {f.dst_ip || "—"}{f.dst_port ? <span className="text-muted-foreground">:{f.dst_port}</span> : ""}
                </div>
                {f.dst_ip && <IpDetails ip={f.dst_ip} />}
              </div>
            </td>
            <td className="px-3 py-2.5">
              <div className="flex flex-col items-center justify-center gap-0.5 truncate w-full">
                <div className="font-semibold text-purple-300 truncate text-center" title={formatAppLabel(f.app_label) || "—"}>
                  {formatAppLabel(f.app_label) || "—"}
                </div>
                {f.domain && (
                  <div className="text-[10px] text-muted-foreground italic truncate text-center" title={f.domain}>
                    {f.domain}
                  </div>
                )}
              </div>
            </td>
            <td className="px-3 py-2.5"><Cell value={f.protocol || "—"} className="text-muted-foreground uppercase text-[10px]" center /></td>
            <td className="px-3 py-2.5"><Cell value={fmtBytes(f.download)} className="text-cyan-400 font-mono" center /></td>
            <td className="px-3 py-2.5"><Cell value={fmtBytes(f.upload)} className="text-emerald-400 font-mono" center /></td>
            <td className="px-3 py-2.5"><Cell value={f.last_seen ? f.last_seen.slice(0, 16).replace("T", " ") : "—"} className="text-slate-400" center /></td>
          </tr>
        ))}
      </TableWrap>
      {totalPages > 1 && (
        <div className="pt-2">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalResults={processedData.length}
            startIndex={startIndex}
            endIndex={startIndex + pageSize}
          />
        </div>
      )}
    </div>
  );
}
