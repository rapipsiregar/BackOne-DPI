"use client";

import { useState } from "react";
import { Shield } from "lucide-react";
import { Pagination } from "./Pagination";

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
    <div className="overflow-x-auto overflow-y-auto max-h-[60vh] rounded-xl border border-border/50 bg-secondary/10 custom-scrollbar">
      <table className="w-full text-xs text-left whitespace-nowrap min-w-[700px]">
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

export default function DeviceThreatsTab({ threats }: Props) {
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const totalPages = Math.ceil(threats.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginated = threats.slice(startIndex, startIndex + pageSize);

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
    { header: "Time",      width: "w-[150px]", align: "center" },
    { header: "Type",      width: "min-w-[150px] w-full" },
    { header: "Severity",  width: "w-[100px]", align: "center" },
    { header: "Target IP", width: "min-w-[120px]" },
  ];

  return (
    <div className="space-y-3">
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
              <td className="px-3 py-2.5"><Cell value={timeStr} className="text-muted-foreground" center /></td>
              <td className="px-3 py-2.5">
                <div
                  title={t.description || t.threat_type || "-"}
                  className="font-semibold text-card-foreground text-xs truncate max-w-full cursor-help hover:text-primary transition-colors block"
                >
                  {t.threat_type || "-"}
                </div>
              </td>
              <td className="px-3 py-2.5 text-center">
                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold ring-1 ${badgeCls}`}>
                  {t.severity || "Unknown"}
                </span>
              </td>
              <td className="px-3 py-2.5"><Cell value={t.dst_ip || t.ip_address || "-"} className="font-mono text-muted-foreground" /></td>
            </tr>
          );
        })}
      </TableWrap>
      {totalPages > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalResults={threats.length}
          startIndex={startIndex}
          endIndex={startIndex + pageSize}
        />
      )}
    </div>
  );
}
