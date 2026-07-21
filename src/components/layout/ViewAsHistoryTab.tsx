"use client";

import { useState, useEffect } from "react";
import { Loader2, Server } from "lucide-react";
import { Pagination } from "../ui/Pagination";
import { getViewAsHeaders } from "@/lib/admin-api";

interface Props {
  onClose: () => void;
}

export default function ViewAsHistoryTab({ onClose }: Props) {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 50;

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/auth/admin/view-as/logs', {
      headers: getViewAsHeaders()
    })
      .then(res => res.json())
      .then(json => {
        if (json.ok && json.data) {
          setLogs(json.data);
        } else {
          setError(json.error || "Failed to fetch logs");
        }
      })
      .catch(err => {
        setError(err.message || "An error occurred");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const totalPages = Math.ceil(logs.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginated = logs.slice(startIndex, startIndex + pageSize);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs text-slate-400">Loading audit history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20 text-center">
        {error}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-10 bg-white/[0.02] border border-white/5 rounded-2xl">
        <Server className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h4 className="text-slate-300 font-bold text-sm mb-1">No Access History</h4>
        <p className="text-slate-400 font-medium max-w-md mx-auto text-[11px]">
          No administrators have entered "View As" session mode yet.
        </p>
      </div>
    );
  }

  const formatDuration = (seconds: number | undefined, hasEnd: any) => {
    if (!hasEnd) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.2 h-1.2 rounded-full bg-emerald-400 animate-pulse" />
          Active
        </span>
      );
    }
    if (seconds === undefined) return "-";
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-3 text-xs">
      <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1.8fr)_minmax(0,1fr)] gap-0 bg-slate-900/80 text-slate-300 border-b border-white/10 p-3 font-semibold text-center">
          <div>Time</div>
          <div>Admin</div>
          <div>Agent Label</div>
          <div>Agent UUID</div>
          <div>Duration</div>
        </div>
        {/* Table Rows */}
        <div className="divide-y divide-white/5 max-h-[40vh] overflow-y-auto">
          {paginated.map((log: any, i: number) => {
            const timeStr = log.timestamp ? new Date(log.timestamp).toLocaleString() : '-';
            return (
              <div key={i} className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1.8fr)_minmax(0,1fr)] gap-0 p-3 hover:bg-blue-500/5 transition-colors text-center items-center">
                <div className="text-slate-400 font-mono text-[11px]">{timeStr}</div>
                <div className="text-slate-200 font-semibold">{log.admin_username}</div>
                <div className="text-blue-300 font-semibold">{log.agent_label}</div>
                <div className="text-slate-400 font-mono text-[11px]">{log.agent_uuid}</div>
                <div className="flex items-center justify-center font-medium text-slate-300">
                  {formatDuration(log.duration, log.end_timestamp)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalResults={logs.length}
        startIndex={startIndex}
        endIndex={startIndex + pageSize}
      />
    </div>
  );
}
