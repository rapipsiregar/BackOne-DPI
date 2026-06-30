"use client";

import { useState, useEffect } from "react";
import { fetchAppDetails, AppDetails } from "@/lib/api";
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

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchAppDetails(appLabel)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [appLabel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl shadow-black/60 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-green-900/30 to-emerald-900/20 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg ring-1 ring-green-500/30">
              {favicon ? (
                <img src={favicon} alt={appLabel} className="w-5 h-5 rounded" />
              ) : (
                <Globe className="w-5 h-5 text-green-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{appLabel}</h3>
              {category && <p className="text-xs text-slate-400">{category}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-green-400" />
              <p className="text-slate-400 text-sm">Loading application data...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-400 text-sm">{error}</div>
          ) : data ? (
            <div className="p-6 space-y-6">

              {/* Total Summary */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-white/[0.03] border border-white/5 rounded-xl">
                <div className="text-center">
                  <p className="text-xs text-slate-500">Total Download</p>
                  <p className="text-xl font-bold text-cyan-400">{fmtBytes(data.total_download ?? 0)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">Total Upload</p>
                  <p className="text-xl font-bold text-green-400">{fmtBytes(data.total_upload ?? 0)}</p>
                </div>
              </div>

              {/* Per-Agent Breakdown */}
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-400" />
                  Usage per Agent
                </h4>
                {data.agent_scorecard.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">No traffic from known agents for this app yet.</p>
                ) : (
                  <div className="space-y-2">
                    {data.agent_scorecard.map((a, i) => {
                      const maxDl = Math.max(...data.agent_scorecard.map(x => x.download), 1);
                      const pct = (a.download / maxDl) * 100;
                      return (
                        <div key={i} className="p-3 bg-white/[0.03] border border-white/5 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-400" />
                              <span className="text-sm font-medium text-white">{a.agent_label}</span>
                              {a.agent_uuid && (
                                <span className="text-xs font-mono text-slate-500">{a.agent_uuid}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs font-mono">
                              <span className="text-cyan-400">↓ {fmtBytes(a.download)}</span>
                              <span className="text-green-400">↑ {fmtBytes(a.upload ?? 0)}</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Top IPs */}
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-cyan-400" />
                  {data.has_domain_breakdown ? "Top Devices (via Domain Match)" : "Top Devices / IPs"}
                  {data.top_ips.filter(ip => ip.blacklisted).length > 0 && (
                    <span className="ml-auto text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full ring-1 ring-red-500/30">
                      🚫 {data.top_ips.filter(ip => ip.blacklisted).length} Blacklisted
                    </span>
                  )}
                </h4>
                {data.top_ips.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">No device data available.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b border-white/10">
                          <th className="pb-2 text-xs font-medium text-slate-400">#</th>
                          <th className="pb-2 text-xs font-medium text-slate-400">IP Address</th>
                          <th className="pb-2 text-xs font-medium text-slate-400 text-right">Download</th>
                          <th className="pb-2 text-xs font-medium text-slate-400 text-right">Upload</th>
                          <th className="pb-2 text-xs font-medium text-slate-400">Usage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {data.top_ips.map((ip, i) => {
                          const maxDl = Math.max(...data.top_ips.map(x => x.download), 1);
                          const pct = (ip.download / maxDl) * 100;
                          return (
                            <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                              <td className="py-2 pr-4 text-xs text-slate-500">{i + 1}</td>
                              <td className="py-2 pr-4 font-mono text-xs">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={ip.blacklisted ? "text-red-400" : "text-blue-400"}>{ip.ip_address || "-"}</span>
                                  {ip.blacklisted && (
                                    <span className="text-xs text-red-300 bg-red-500/10 px-1.5 py-0.5 rounded-full ring-1 ring-red-500/30">🚫</span>
                                  )}
                                  {!ip.blacklisted && ip.reputation && ip.reputation !== "Unknown" && (
                                    <span className="text-xs text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">{ip.reputation}</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 pr-4 text-right text-xs text-cyan-400">{fmtBytes(ip.download)}</td>
                              <td className="py-2 pr-4 text-right text-xs text-green-400">{fmtBytes(ip.upload ?? 0)}</td>
                              <td className="py-2 w-32">
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${ip.blacklisted ? "bg-red-500" : "bg-gradient-to-r from-cyan-500 to-green-500"}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
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
