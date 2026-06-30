"use client";

import { useState, useEffect } from "react";
import { fetchAgentDetails, AgentDetails } from "@/lib/api";
import { fmtBytes } from "@/lib/utils";
import { Loader2, X, Server, Monitor, Activity, Globe, ChevronRight } from "lucide-react";

interface Props {
  agentUuid: string;
  agentLabel: string;
  onClose: () => void;
}

type Tab = "devices" | "flows" | "apps";

export function AgentDetailModal({ agentUuid, agentLabel, onClose }: Props) {
  const [data, setData] = useState<AgentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("devices");

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchAgentDetails(agentUuid)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [agentUuid]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "devices", label: "Devices", icon: <Monitor className="w-4 h-4" />, count: data?.devices.length },
    { key: "flows", label: "Active Flows", icon: <Activity className="w-4 h-4" />, count: data?.flows.length },
    { key: "apps", label: "Top Apps", icon: <Globe className="w-4 h-4" />, count: data?.top_apps.length },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl shadow-black/60 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-blue-900/30 to-purple-900/20 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg ring-1 ring-blue-500/30">
              <Server className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{agentLabel}</h3>
              <p className="text-xs text-slate-400 font-mono">{agentUuid}</p>
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
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              <p className="text-slate-400 text-sm">Loading agent data...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-400 text-sm">{error}</div>
          ) : data ? (
            <>
              {/* KPI Summary row */}
              <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-white/5">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-slate-400 mb-1">Devices</p>
                  <p className="text-2xl font-bold text-white">{data.devices.length}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-slate-400 mb-1">Active Flows</p>
                  <p className="text-2xl font-bold text-white">{data.summary?.active_flows ?? data.flows.length}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-slate-400 mb-1">Total Download</p>
                  <p className="text-2xl font-bold text-cyan-400">{fmtBytes(data.summary?.bandwidth_down ?? 0)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-slate-400 mb-1">Total Upload</p>
                  <p className="text-2xl font-bold text-green-400">{fmtBytes(data.summary?.bandwidth_up ?? 0)}</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 px-6 py-3 border-b border-white/5">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.key
                        ? "bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/40"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className="ml-1 px-1.5 py-0.5 bg-white/10 rounded text-xs text-slate-300">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="px-6 py-4">
                {activeTab === "devices" && (
                  <div className="space-y-2">
                    {data.devices.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-8">No devices found for this agent.</p>
                    ) : (
                      data.devices.map((d, i) => {
                        const riskCfg = d.risk_level === "Rawan" || d.risk_level === "Critical"
                          ? { color: "text-red-400", bg: "bg-red-500/10 ring-red-500/30", dot: "bg-red-400", label: d.risk_level }
                          : d.risk_level === "Sedang" || d.risk_level === "Medium"
                          ? { color: "text-yellow-400", bg: "bg-yellow-500/10 ring-yellow-500/30", dot: "bg-yellow-400", label: d.risk_level }
                          : d.risk_level === "Aman" || d.risk_level === "Low"
                          ? { color: "text-green-400", bg: "bg-green-500/10 ring-green-500/30", dot: "bg-green-400", label: d.risk_level }
                          : null;
                        return (
                          <div key={i} className="p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-lg transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 p-2 bg-slate-800/60 rounded-lg">
                                <Monitor className="w-4 h-4 text-slate-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium text-white text-sm truncate">{d.device_label || d.ip_address || "Unknown"}</p>
                                  {riskCfg && (
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${riskCfg.bg} ${riskCfg.color}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${riskCfg.dot}`} />
                                      {riskCfg.label}
                                    </span>
                                  )}
                                  {d.has_insecure && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ring-1 bg-orange-500/10 ring-orange-500/30 text-orange-400">
                                      ⚠ Insecure
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-0.5">
                                  <p className="text-xs text-slate-400 font-mono">{d.ip_address}</p>
                                  {d.os_label && <p className="text-xs text-blue-400">{d.os_label}</p>}
                                  {d.manufacturer && <p className="text-xs text-slate-500">{d.manufacturer}</p>}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 space-y-0.5">
                                <p className="text-xs text-cyan-400">{fmtBytes(d.download ?? 0)}</p>
                                {d.encrypted_pct !== null && (
                                  <p className="text-xs text-slate-500">🔒 {d.encrypted_pct}%</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {activeTab === "flows" && (
                  <div className="overflow-x-auto">
                    {data.flows.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-8">No flows found for this agent.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left border-b border-white/10">
                            <th className="pb-2 text-xs font-medium text-slate-400">Source IP</th>
                            <th className="pb-2 text-xs font-medium text-slate-400">Destination</th>
                            <th className="pb-2 text-xs font-medium text-slate-400">App / Domain</th>
                            <th className="pb-2 text-xs font-medium text-slate-400">Protocol</th>
                            <th className="pb-2 text-xs font-medium text-slate-400 text-right">Download</th>
                            <th className="pb-2 text-xs font-medium text-slate-400 text-right">Upload</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {data.flows.map((f, i) => (
                            <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                              <td className="py-2 pr-4 font-mono text-xs text-blue-400">{f.src_ip || "-"}</td>
                              <td className="py-2 pr-4 font-mono text-xs text-slate-300">
                                {f.dst_ip || "-"}
                                {f.dst_port ? <span className="text-slate-500">:{f.dst_port}</span> : ""}
                              </td>
                              <td className="py-2 pr-4 text-xs text-purple-300 max-w-[140px] truncate">
                                {f.app_label || f.domain || "-"}
                              </td>
                              <td className="py-2 pr-4 text-xs text-slate-400">{f.protocol || "-"}</td>
                              <td className="py-2 pr-4 text-right text-xs text-cyan-400">{fmtBytes(f.download)}</td>
                              <td className="py-2 text-right text-xs text-green-400">{fmtBytes(f.upload)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === "apps" && (
                  <div className="space-y-2">
                    {data.top_apps.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-8">No application data for this agent.</p>
                    ) : (
                      data.top_apps.map((a, i) => {
                        const total = a.download + a.upload;
                        const maxTotal = Math.max(...data.top_apps.map(x => x.download + x.upload), 1);
                        const pct = (total / maxTotal) * 100;
                        return (
                          <div key={i} className="p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-lg transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                              {a.favicon ? (
                                <img src={a.favicon} alt={a.app_label} className="w-5 h-5 rounded bg-white p-0.5 flex-shrink-0" />
                              ) : (
                                <div className="w-5 h-5 rounded bg-slate-700 flex-shrink-0" />
                              )}
                              <span className="font-medium text-white text-sm flex-1">{a.app_label}</span>
                              {a.category && <span className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded">{a.category}</span>}
                              <span className="text-xs font-mono text-white">{fmtBytes(total)}</span>
                            </div>
                            <div className="flex gap-2 text-xs text-slate-400">
                              <span className="text-cyan-400">↓ {fmtBytes(a.download)}</span>
                              <span className="text-green-400">↑ {fmtBytes(a.upload)}</span>
                            </div>
                            <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
