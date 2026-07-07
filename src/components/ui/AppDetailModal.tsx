"use client";

import { useState, useEffect } from "react";
import { fetchAppDetails, AppDetails } from "@/lib/api";
import { useTimeFilter } from "@/contexts/TimeFilterContext";
import { fmtBytes } from "@/lib/utils";
import { Loader2, X, Globe, Server, Monitor } from "lucide-react";

interface Props {
  appLabel: string;
  favicon?: string | null;
  category?: string | null;
  onClose: () => void;
}

export function AppDetailModal({ appLabel, favicon, category, onClose }: Props) {
  const [data, setData] = useState<AppDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const { timeRange } = useTimeFilter();

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 480);
  };

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchAppDetails(appLabel, timeRange)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [appLabel, timeRange]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className={`absolute inset-0 bg-black/40 dark:bg-black/75 backdrop-blur-sm ${isClosing ? 'animate-overlay-out' : 'animate-overlay-in'}`} />
      <div
        className={`relative bg-card border border-border rounded-2xl w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl shadow-black/60 ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-green-900/30 to-emerald-900/20 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg ring-1 ring-green-500/30">
              {favicon ? (
                <img src={favicon} alt={appLabel} className="w-5 h-5 rounded" />
              ) : (
                <Globe className="w-5 h-5 text-green-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-card-foreground">{appLabel}</h3>
              {category && <p className="text-xs text-muted-foreground">{category}</p>}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-muted-foreground hover:text-card-foreground hover:bg-secondary rounded-lg transition-all flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-green-400" />
              <p className="text-muted-foreground text-sm">Loading application data...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-400 text-sm">{error}</div>
          ) : data ? (
            <div className="p-6 space-y-6">

              {/* Total Summary */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-white/[0.03] border border-border/50 rounded-xl">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total Download</p>
                  <p className="text-xl font-bold text-cyan-400">{fmtBytes(data.total_download ?? 0)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total Upload</p>
                  <p className="text-xl font-bold text-green-400">{fmtBytes(data.total_upload ?? 0)}</p>
                </div>
              </div>

              {/* Devices accessing this app */}
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-blue-400" />
                  Devices Accessing {appLabel}
                </h4>
                {(!data.devices || data.devices.length === 0) ? (
                  <p className="text-muted-foreground text-sm text-center py-4">No active devices found for this app in the selected time range.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border/50 bg-white/[0.02]">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead className="bg-secondary/40 text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 font-medium">Timestamp</th>
                          <th className="px-4 py-3 font-medium">Agent</th>
                          <th className="px-4 py-3 font-medium">IP Address</th>
                          <th className="px-4 py-3 font-medium">Hostname</th>
                          <th className="px-4 py-3 font-medium">OS</th>
                          <th className="px-4 py-3 font-medium">MAC Address</th>
                          <th className="px-4 py-3 font-medium">Download</th>
                          <th className="px-4 py-3 font-medium">Upload</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {data.devices.map((dev: any, i: number) => (
                          <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3 text-muted-foreground">{new Date(dev.timestamp).toLocaleString()}</td>
                            <td className="px-4 py-3">{dev.agent_uuid || 'Global'}</td>
                            <td className="px-4 py-3 font-mono text-blue-300">{dev.ip || '-'}</td>
                            <td className="px-4 py-3">{dev.hostname || '-'}</td>
                            <td className="px-4 py-3">{dev.os || '-'}</td>
                            <td className="px-4 py-3 font-mono text-muted-foreground">{dev.mac || '-'}</td>
                            <td className="px-4 py-3 text-cyan-400">{fmtBytes(dev.download)}</td>
                            <td className="px-4 py-3 text-green-400">{fmtBytes(dev.upload)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}


