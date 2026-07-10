"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import { fmtBytes } from "@/lib/utils";
import { Pagination } from "./Pagination";

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
      <table className="w-full text-xs text-left whitespace-nowrap min-w-[800px]">
        <thead className="sticky top-0 bg-[#111827] z-10">
          <tr className="border-b border-border">
            {cols.map((c) => (
              <th
                key={c.header}
                className={`px-3 py-2.5 font-medium text-muted-foreground uppercase tracking-wider text-[10px] ${
                  c.align === "center" ? "text-center" : c.align === "right" ? "text-right" : "text-left"
                } ${c.width}`}
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

function Cell({ value, className = "", center = false, right = false }: { value: string | number; className?: string; center?: boolean; right?: boolean }) {
  const str = String(value ?? "—");
  const align = center ? "text-center" : right ? "text-right" : "";
  return (
    <div className={`truncate overflow-hidden text-ellipsis ${align} ${className}`} title={str}>
      {str || "—"}
    </div>
  );
}

export default function DeviceFlowsTab({ flows, ip }: Props) {
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const totalPages = Math.ceil(flows.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginated = flows.slice(startIndex, startIndex + pageSize);

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
    { header: "Time",           width: "w-[130px]", align: "center" },
    { header: "Source",         width: "min-w-[120px]" },
    { header: "Destination",    width: "min-w-[120px]" },
    { header: "Port",           width: "w-[80px]", align: "center" },
    { header: "App / Protocol", width: "min-w-[150px] w-full" },
    { header: "Download",       width: "w-[90px]", align: "right" },
    { header: "Upload",         width: "w-[90px]", align: "right" },
  ];

  return (
    <div className="space-y-3">
      <TableWrap cols={COLS}>
        {paginated.map((f: any, i: number) => {
          const isOutbound = f.src_ip === ip;
          const timeStr = f.last_seen ? new Date(f.last_seen).toLocaleString() : '-';
          return (
            <tr key={i} className="hover:bg-white/[0.04] transition-colors duration-150">
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
                <span className="bg-white/10 text-slate-200 px-2 py-0.5 rounded text-[10px] font-medium border border-white/5 truncate max-w-full inline-block align-middle" title={f.app_label || f.protocol || '-'}>
                  {f.app_label || f.protocol || '-'}
                </span>
              </td>
              <td className="px-3 py-2.5"><Cell value={fmtBytes(f.download)} className="text-cyan-400 font-mono" right /></td>
              <td className="px-3 py-2.5"><Cell value={fmtBytes(f.upload)} className="text-emerald-400 font-mono" right /></td>
            </tr>
          );
        })}
      </TableWrap>
      {totalPages > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalResults={flows.length}
          startIndex={startIndex}
          endIndex={startIndex + pageSize}
        />
      )}
    </div>
  );
}
