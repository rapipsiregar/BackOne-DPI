"use client";

import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { fmtBytes } from "@/lib/utils";

interface DeviceKpiSectionProps {
  totalDownload: number;
  totalUpload: number;
}

export default function DeviceKpiSection({ totalDownload, totalUpload }: DeviceKpiSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="p-4 sm:p-6 bg-gradient-to-br from-cyan-500/5 dark:from-cyan-500/10 to-transparent border border-cyan-100 dark:border-cyan-500/20 rounded-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <ArrowDownToLine className="w-12 h-12 sm:w-16 sm:h-16 text-cyan-500 dark:text-cyan-400" />
        </div>
        <p className="text-xs sm:text-sm font-medium text-cyan-600 dark:text-cyan-400/80 mb-2 flex items-center gap-2">
          <ArrowDownToLine className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Total Download
        </p>
        <p className="text-2xl sm:text-4xl font-black text-card-foreground tracking-tight">{fmtBytes(totalDownload)}</p>
      </div>
      <div className="p-4 sm:p-6 bg-gradient-to-br from-emerald-500/5 dark:from-emerald-500/10 to-transparent border border-emerald-100 dark:border-emerald-500/20 rounded-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <ArrowUpFromLine className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-500 dark:text-emerald-400" />
        </div>
        <p className="text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400/80 mb-2 flex items-center gap-2">
          <ArrowUpFromLine className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Total Upload
        </p>
        <p className="text-2xl sm:text-4xl font-black text-card-foreground tracking-tight">{fmtBytes(totalUpload)}</p>
      </div>
    </div>
  );
}
