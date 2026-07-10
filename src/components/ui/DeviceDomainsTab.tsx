"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { fmtBytes } from "@/lib/utils";
import { Pagination } from "./Pagination";

interface Props {
  domains: any[];
  totalDownload: number;
  totalUpload: number;
}

export default function DeviceDomainsTab({ domains, totalDownload, totalUpload }: Props) {
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const totalPages = Math.ceil(domains.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginated = domains.slice(startIndex, startIndex + pageSize);

  const totalBytes = totalDownload + totalUpload;

  if (domains.length === 0) {
    return (
      <div className="text-center py-10 bg-slate-50/50 dark:bg-white/[0.02] border border-border rounded-2xl">
        <Globe className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
        <h4 className="text-card-foreground font-bold text-lg mb-1">No Web/Domain Traffic</h4>
        <p className="text-muted-foreground font-medium max-w-md mx-auto">
          No distinct domain names have been extracted from SNI or DNS data for this IP yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginated.map((dom: any, i: number) => {
          const appBytes = dom.download + dom.upload;
          const pct = totalBytes > 0 ? ((appBytes / totalBytes) * 100).toFixed(1) : "0";
          return (
            <div key={i} className="bg-slate-50/50 dark:bg-white/[0.03] border border-border p-4 rounded-2xl hover:bg-slate-100/50 dark:hover:bg-white/[0.05] transition-colors group relative overflow-hidden text-xs">
              <div className="absolute top-0 left-0 h-1 bg-purple-500/30 transition-all duration-500" style={{ width: `${pct}%` }} />
              <h5 className="font-semibold text-card-foreground mb-3 text-sm flex justify-between items-center truncate gap-2" title={dom.app_label}>
                <span className="truncate">{dom.app_label}</span>
                <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full ring-1 ring-purple-500/20 shrink-0">{pct}%</span>
              </h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Download</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-mono font-medium">{fmtBytes(dom.download)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Upload</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">{fmtBytes(dom.upload)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalResults={domains.length}
        startIndex={startIndex}
        endIndex={startIndex + pageSize}
      />
    </div>
  );
}
