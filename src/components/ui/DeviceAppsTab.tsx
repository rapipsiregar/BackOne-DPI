"use client";

import { useState } from "react";
import { Box } from "lucide-react";
import { fmtBytes } from "@/lib/utils";
import { Pagination } from "./Pagination";

interface Props {
  apps: any[];
  totalDownload: number;
  totalUpload: number;
}

export default function DeviceAppsTab({ apps, totalDownload, totalUpload }: Props) {
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const totalPages = Math.ceil(apps.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginated = apps.slice(startIndex, startIndex + pageSize);

  const totalBytes = totalDownload + totalUpload;

  if (apps.length === 0) {
    return (
      <div className="text-center py-10 bg-slate-50/50 dark:bg-white/[0.02] border border-border rounded-2xl">
        <Box className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
        <h4 className="text-card-foreground font-bold text-lg mb-1">No Application Traffic</h4>
        <p className="text-muted-foreground font-medium max-w-md mx-auto">
          No application-specific traffic has been classified for this IP yet, or data is currently being ingested from the network sensor.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginated.map((app: any, i: number) => {
          const appBytes = app.download + app.upload;
          const pct = totalBytes > 0 ? ((appBytes / totalBytes) * 100).toFixed(1) : "0";
          return (
            <div key={i} className="bg-slate-50/50 dark:bg-white/[0.03] border border-border p-4 rounded-2xl hover:bg-slate-100/50 dark:hover:bg-white/[0.05] transition-colors group relative overflow-hidden text-xs">
              <div className="absolute top-0 left-0 h-1 bg-blue-500/30 transition-all duration-500" style={{ width: `${pct}%` }} />
              <h5 className="font-semibold text-card-foreground mb-3 text-sm flex justify-between items-center">
                {app.app_label}
                <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full ring-1 ring-blue-500/20">{pct}%</span>
              </h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Download</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-mono font-medium">{fmtBytes(app.download)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Upload</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">{fmtBytes(app.upload)}</span>
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
        totalResults={apps.length}
        startIndex={startIndex}
        endIndex={startIndex + pageSize}
      />
    </div>
  );
}
