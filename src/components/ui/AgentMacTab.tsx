"use client";

import { useState } from "react";
import { Wifi } from "lucide-react";
import { fmtBytes } from "@/lib/utils";
import { Pagination } from "./Pagination";

interface Props {
  macBandwidth: any[];
}

export default function AgentMacTab({ macBandwidth }: Props) {
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const totalPages = Math.ceil(macBandwidth.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginated = macBandwidth.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {paginated.map((m, i) => {
          const maxTotal = Math.max(...macBandwidth.map(x => x.total ?? 0), 1);
          const pct = ((m.total ?? 0) / maxTotal) * 100;
          return (
            <div key={i} className="p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-border/50 rounded-xl transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Wifi className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-slate-200">{m.mac_address}</p>
                  <p className="text-xs text-muted-foreground">{m.manufacturer || "Unknown Manufacturer"}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-card-foreground font-medium">{fmtBytes(m.total ?? 0)}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
              <div className="flex gap-4 text-xs mb-2">
                <span className="text-cyan-400">DL: {fmtBytes(m.download ?? 0)}</span>
                <span className="text-green-400">UL: {fmtBytes(m.upload ?? 0)}</span>
              </div>
              <div className="h-1 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalResults={macBandwidth.length}
        startIndex={startIndex}
        endIndex={startIndex + pageSize}
      />
    </div>
  );
}
