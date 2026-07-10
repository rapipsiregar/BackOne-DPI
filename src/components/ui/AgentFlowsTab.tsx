"use client";

import { useState } from "react";
import { fmtBytes } from "@/lib/utils";
import { IpDetails } from "./IpDetails";
import { Pagination } from "./Pagination";

interface ColDef {
  header: string;
  width: string;
  align?: "center" | "right";
}

function TableWrap({ children, cols }: { children: React.ReactNode; cols: ColDef[] }) {
  return (
    <div className="overflow-x-auto overflow-y-hidden rounded-xl border border-border/50 bg-secondary/10 custom-scrollbar">
      <table className="w-full text-xs text-left whitespace-nowrap min-w-[800px]">
        <thead>
          <tr className="border-b border-border bg-muted/50">
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

// ─── Cell with overflow ellipsis + title tooltip ────────────────────────────────
function Cell({ value, className = "", center = false, right = false }: { value: string | number; className?: string; center?: boolean; right?: boolean }) {
  const str = String(value ?? "—");
  const align = center ? "text-center" : right ? "text-right" : "";
  return (
    <div className={`truncate overflow-hidden text-ellipsis ${align} ${className}`} title={str}>
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

  const totalPages = Math.ceil(flows.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginated = flows.slice(startIndex, startIndex + pageSize);

  const COLS: ColDef[] = [
    { header: "Source IP",    width: "min-w-[100px]" },
    { header: "Destination",  width: "min-w-[140px]" },
    { header: "App / Domain", width: "min-w-[160px] w-full" },
    { header: "Protocol",     width: "w-[80px]" },
    { header: "Download",     width: "w-[90px]", align: "right" },
    { header: "Upload",       width: "w-[90px]", align: "right" },
    { header: "Last Seen",    width: "w-[120px]" },
  ];

  return (
    <div className="space-y-3">
      <TableWrap cols={COLS}>
        {paginated.map((f, i) => (
          <tr key={i} className="hover:bg-white/[0.04] transition-colors duration-150">
            <td className="px-3 py-2.5"><Cell value={f.src_ip || "—"} className="font-mono text-blue-400" /></td>
            <td className="px-3 py-2.5">
              <div className="flex flex-col gap-0.5 truncate min-w-0">
                <div className="font-mono text-slate-300 truncate" title={`${f.dst_ip || "—"}${f.dst_port ? ':' + f.dst_port : ''}`}>
                  {f.dst_ip || "—"}{f.dst_port ? <span className="text-muted-foreground">:{f.dst_port}</span> : ""}
                </div>
                {f.dst_ip && <IpDetails ip={f.dst_ip} />}
              </div>
            </td>
            <td className="px-3 py-2.5">
              <div className="flex flex-col gap-0.5 truncate min-w-0">
                <div className="font-semibold text-purple-300 truncate" title={f.app_label || "—"}>
                  {f.app_label || "—"}
                </div>
                {f.domain && (
                  <div className="text-[10px] text-muted-foreground italic truncate" title={f.domain}>
                    {f.domain}
                  </div>
                )}
              </div>
            </td>
            <td className="px-3 py-2.5"><Cell value={f.protocol || "—"} className="text-muted-foreground uppercase text-[10px]" /></td>
            <td className="px-3 py-2.5"><Cell value={fmtBytes(f.download)} className="text-cyan-400 font-mono" right /></td>
            <td className="px-3 py-2.5"><Cell value={fmtBytes(f.upload)} className="text-emerald-400 font-mono" right /></td>
            <td className="px-3 py-2.5"><Cell value={f.last_seen ? f.last_seen.slice(0, 16).replace("T", " ") : "—"} className="text-slate-400" /></td>
          </tr>
        ))}
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
