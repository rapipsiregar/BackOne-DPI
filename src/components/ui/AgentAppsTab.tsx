"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import { fmtBytes } from "@/lib/utils";

interface AgentAppItem {
  app_id: number | null;
  app_label: string;
  category: string | null;
  download: number;
  upload: number;
}

interface AgentAppsTabProps {
  topApps: AgentAppItem[];
  onSelectApp: (label: string) => void;
}

export default function AgentAppsTab({ topApps, onSelectApp }: AgentAppsTabProps) {
  if (topApps.length === 0) {
    return <p className="text-muted-foreground text-sm text-center py-10">No applications accessed by this agent.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {topApps.map((app) => {
        const appTotal = app.download + app.upload;
        return (
          <button
            key={app.app_id}
            onClick={() => onSelectApp(app.app_label)}
            className="flex items-center gap-3 p-3 bg-white/[0.03] hover:bg-white/[0.07] border border-border/50 rounded-xl transition-all group w-full text-left"
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-card-foreground text-sm truncate group-hover:text-cyan-300 transition-colors">
                {app.app_label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{app.category || "Web"}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-card-foreground font-semibold">{fmtBytes(appTotal)}</p>
              <span className="text-[10px] text-muted-foreground flex gap-2">
                <span className="text-cyan-400">DL: {fmtBytes(app.download)}</span>
                <span className="text-green-400">UL: {fmtBytes(app.upload)}</span>
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
          </button>
        );
      })}
    </div>
  );
}
