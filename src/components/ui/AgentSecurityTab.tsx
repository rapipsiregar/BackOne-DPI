"use client";

import { AlertTriangle, Lock, Eye, Router } from "lucide-react";
import { fmtBytes } from "@/lib/utils";
import { IpDetails } from "./IpDetails";

interface Props {
  data: any;
}

interface ColDef {
  header: string;
  width: string;
  align?: "center" | "right";
}

function TableWrap({ children, cols }: { children: React.ReactNode; cols: ColDef[] }) {
  return (
    <div className="overflow-x-auto overflow-y-hidden rounded-xl border border-border/50 bg-secondary/10 custom-scrollbar">
      <table className="w-full text-xs text-left whitespace-nowrap min-w-[700px]">
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

function Cell({ value, className = "", center = false, right = false }: { value: string | number; className?: string; center?: boolean; right?: boolean }) {
  const str = String(value ?? "—");
  const align = center ? "text-center" : right ? "text-right" : "";
  return (
    <div className={`truncate overflow-hidden text-ellipsis ${align} ${className}`} title={str}>
      {str || "—"}
    </div>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return <p className="text-muted-foreground text-sm text-center py-10">{msg}</p>;
}

function severityStyle(sev: string | null) {
  switch ((sev || "").toLowerCase()) {
    case "critical": return { badge: "bg-red-500/15 text-red-400 ring-red-500/30", dot: "bg-red-400" };
    case "high":     return { badge: "bg-orange-500/15 text-orange-400 ring-orange-500/30", dot: "bg-orange-400" };
    case "warning":  return { badge: "bg-yellow-500/15 text-yellow-400 ring-yellow-500/30", dot: "bg-yellow-400" };
    case "info":     return { badge: "bg-blue-500/15 text-blue-400 ring-blue-500/30", dot: "bg-blue-400" };
    default:         return { badge: "bg-slate-500/15 text-muted-foreground ring-slate-500/30", dot: "bg-slate-400" };
  }
}

export default function AgentSecurityTab({ data }: Props) {
  const security = data?.security;
  if (!security) return <EmptyState msg="No security data available." />;

  const INSECURE_COLS: ColDef[] = [
    { header: "IP",          width: "min-w-[100px]" },
    { header: "Protocol",    width: "min-w-[80px]" },
    { header: "Risk",        width: "min-w-[100px]" },
    { header: "App",         width: "min-w-[120px] w-full" },
    { header: "Dst IP:Port", width: "min-w-[140px]" },
    { header: "Download",    width: "w-[80px]", align: "right" },
    { header: "Upload",      width: "w-[80px]", align: "right" },
  ];

  const REPUTATION_COLS: ColDef[] = [
    { header: "Remote IP",   width: "min-w-[120px]" },
    { header: "Local IP",    width: "min-w-[120px]" },
    { header: "Reputation",  width: "min-w-[140px] w-full" },
    { header: "Score",       width: "w-[80px]", align: "center" },
    { header: "Country",     width: "w-[80px]" },
    { header: "Status",      width: "w-[100px]" },
  ];

  return (
    <div className="space-y-4">
      {/* Insecure Protocols */}
      <section>
        <h4 className="flex items-center gap-2 text-sm font-semibold text-card-foreground mb-3">
          <UnlockIcon className="w-4 h-4 text-orange-400" /> Insecure Protocols
          <span className="ml-auto text-xs text-muted-foreground">{security.insecure_protocols?.length ?? 0} records</span>
        </h4>
        {(security.insecure_protocols?.length ?? 0) === 0 ? <EmptyState msg="No insecure protocols detected for this agent." /> : (
          <TableWrap cols={INSECURE_COLS}>
            {security.insecure_protocols.map((r: any, i: number) => {
              const sc = severityStyle(r.risk);
              return (
                <tr key={i} className="hover:bg-white/[0.04] transition-colors duration-150">
                  <td className="px-3 py-2.5"><Cell value={r.ip_address || "—"} className="font-mono text-blue-400" /></td>
                  <td className="px-3 py-2.5"><Cell value={r.protocol || "—"} className="text-slate-200" /></td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold tracking-wide ring-1 ${sc.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {r.risk || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5"><Cell value={r.app_label || "—"} className="text-purple-300" /></td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-col gap-0.5 truncate min-w-0">
                      <div className="font-mono text-muted-foreground truncate" title={r.dst_ip ? `${r.dst_ip}:${r.dst_port ?? "?"}` : "—"}>
                        {r.dst_ip ? `${r.dst_ip}:${r.dst_port ?? "?"}` : "—"}
                      </div>
                      {r.dst_ip && <IpDetails ip={r.dst_ip} />}
                    </div>
                  </td>
                  <td className="px-3 py-2.5"><Cell value={fmtBytes(r.download)} className="text-cyan-400 font-mono" right /></td>
                  <td className="px-3 py-2.5"><Cell value={fmtBytes(r.upload)} className="text-green-400 font-mono" right /></td>
                </tr>
              );
            })}
          </TableWrap>
        )}
      </section>

      {/* IP Reputation */}
      {(security.ip_reputation?.length ?? 0) > 0 && (
        <section>
          <h4 className="flex items-center gap-2 text-sm font-semibold text-card-foreground mb-3">
            <Eye className="w-4 h-4 text-purple-400" /> IP Reputation
            <span className="ml-auto text-xs text-muted-foreground">{security.ip_reputation.length} records</span>
          </h4>
          <TableWrap cols={REPUTATION_COLS}>
            {security.ip_reputation.map((r: any, i: number) => (
              <tr key={i} className="hover:bg-white/[0.04] transition-colors duration-150">
                <td className="px-3 py-2.5"><Cell value={r.ip_address || "—"} className="font-mono text-red-400" /></td>
                <td className="px-3 py-2.5"><Cell value={r.local_ip || "—"} className="font-mono text-blue-400" /></td>
                <td className="px-3 py-2.5"><Cell value={r.reputation || "—"} className="text-slate-300" /></td>
                <td className="px-3 py-2.5"><Cell value={r.score ?? "—"} className="text-yellow-400 font-mono" center /></td>
                <td className="px-3 py-2.5"><Cell value={r.country || "—"} className="text-muted-foreground" /></td>
                <td className="px-3 py-2.5 text-xs">
                  {r.blacklisted ? <span className="text-red-400 font-semibold">Blocked</span> : <span className="text-green-400">Allowed</span>}
                </td>
              </tr>
            ))}
          </TableWrap>
        </section>
      )}
    </div>
  );
}

function UnlockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
    </svg>
  );
}
