"use client";

import { useState } from "react";
import { Pagination } from "./Pagination";

interface Props {
  events: any[];
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

export default function AgentEventsTab({ events }: Props) {
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const totalPages = Math.ceil(events.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginated = events.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {paginated.map((ev, i) => {
          const sc = severityStyle(ev.severity);
          return (
            <div
              key={i}
              className={`p-3 border rounded-xl text-xs transition-colors ${
                (ev.severity || "").toLowerCase() === "critical"
                  ? "bg-red-500/5 border-red-500/20 hover:bg-red-500/10"
                  : (ev.severity || "").toLowerCase() === "high"
                  ? "bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10"
                  : "bg-white/[0.03] border-border/50 hover:bg-white/[0.06]"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ring-1 flex-shrink-0 ${sc.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                  {ev.severity || "—"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-card-foreground">{ev.event_type || "Unknown"}</span>
                    <span className="font-mono text-blue-400">{ev.ip_address || "—"}</span>
                    {ev.mac_address && <span className="font-mono text-muted-foreground">{ev.mac_address}</span>}
                  </div>
                  {ev.description && <p className="text-muted-foreground leading-relaxed">{ev.description}</p>}
                </div>
                <span className="text-slate-600 flex-shrink-0 truncate">
                  {ev.event_at ? ev.event_at.slice(0, 16).replace("T", " ") : "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalResults={events.length}
        startIndex={startIndex}
        endIndex={startIndex + pageSize}
      />
    </div>
  );
}
