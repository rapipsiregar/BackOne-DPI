"use client";

import { useState, useEffect } from "react";
import { fetchDeviceDetails, DeviceDetails } from "@/lib/api";
import { fmtBytes } from "@/lib/utils";
import { Loader2, X, Monitor, Globe, Activity } from "lucide-react";

interface Props {
  ip: string;
  deviceLabel?: string | null;
  macAddress?: string | null;
  onClose: () => void;
}

type Tab = "apps" | "flows";

export function DeviceDetailModal({ ip, deviceLabel, macAddress, onClose }: Props) {
  const [data, setData] = useState<DeviceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("apps");

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchDeviceDetails(ip)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [ip]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "apps", label: "Applications", icon: <Globe className="w-4 h-4" />, count: data?.top_apps.length },
    { key: "flows", label: "Active Flows", icon: <Activity className="w-4 h-4" />, count: data?.flows.length },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl shadow-black/60 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-cyan-900/30 to-blue-900/20 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg ring-1 ring-cyan-500/30">
              <Monitor className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{deviceLabel || ip}</h3>
              <div className="flex items-center gap-3 mt-0.5">
                <p className="text-xs text-blue-400 font-mono">{ip}</p>
                {macAddress && <p className="text-xs text-slate-400 font-mono">{macAddress}</p>}
              </div>
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
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              <p className="text-slate-400 text-sm">Loading device data...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-400 text-sm">{error}</div>
          ) : data ? (
            <>
              {/* KPI Summary */}
              <div className="grid grid-cols-3 gap-3 px-6 py-3 border-b border-white/5 bg-white/[0.02]">
                <div className="text-center">
                  <p className="text-xs text-slate-500">Total Download</p>
                  <p className="text-lg font-bold text-cyan-400">{fmtBytes(data.total_download ?? 0)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">Total Upload</p>
                  <p className="text-lg font-bold text-green-400">{fmtBytes(data.total_upload ?? 0)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">Total Flows</p>
                  <p className="text-lg font-bold text-white">{data.flow_count ?? data.flows.length}</p>
                </div>
              </div>

              {/* Security Info Panel */}
              {data.security_info && (data.security_info.risk_level || data.security_info.os_label || data.security_info.device_type || data.security_info.insecure_protocols.length > 0 || data.security_info.blacklisted) && (() => {
                const si = data.security_info!;
                const riskColor = si.risk_level === "Rawan" || si.risk_level === "Critical" ? "text-red-400 bg-red-500/10 ring-red-500/30"
                  : si.risk_level === "Sedang" || si.risk_level === "Medium" ? "text-yellow-400 bg-yellow-500/10 ring-yellow-500/30"
                  : "text-green-400 bg-green-500/10 ring-green-500/30";
                const encPct = si.encrypted_pct ?? 0;
                return (
                  <div className="mx-6 my-3 p-4 bg-white/[0.02] border border-white/8 rounded-xl space-y-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Security Info</p>

                    {/* Row 1: Device Identity */}
                    {(si.device_type || si.os_label || si.manufacturer) && (
                      <div className="flex items-center gap-3 flex-wrap">
                        {si.device_type && <span className="text-xs text-slate-300 bg-white/5 px-2 py-0.5 rounded">{si.device_type}</span>}
                        {si.os_label && <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">{si.os_label}</span>}
                        {si.manufacturer && <span className="text-xs text-slate-400">{si.manufacturer}</span>}
                      </div>
                    )}

                    {/* Row 2: Encryption bar */}
                    {si.encrypted_pct !== null && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-400">Enkripsi Traffic</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ring-1 ${riskColor}`}>
                              {si.risk_level}
                            </span>
                            <span className="text-xs text-white font-mono">{encPct}%</span>
                          </div>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${encPct >= 80 ? "bg-green-500" : encPct >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${encPct}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-slate-500">
                          <span>Terenkripsi: {fmtBytes(si.encrypted_bytes ?? 0)}</span>
                          <span>Tidak: {fmtBytes(si.unencrypted_bytes ?? 0)}</span>
                        </div>
                      </div>
                    )}

                    {/* Row 3: Warnings */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {si.insecure_protocols.length > 0 && si.insecure_protocols.map((p, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-xs text-orange-300 bg-orange-500/10 px-2 py-0.5 rounded-full ring-1 ring-orange-500/30">
                          ⚠ {p.protocol} ({p.risk})
                        </span>
                      ))}
                      {si.blacklisted && (
                        <span className="inline-flex items-center gap-1 text-xs text-red-300 bg-red-500/10 px-2 py-0.5 rounded-full ring-1 ring-red-500/30">
                          🚫 Blacklisted
                        </span>
                      )}
                      {si.reputation && si.reputation !== "Unknown" && !si.blacklisted && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-300 bg-white/5 px-2 py-0.5 rounded-full">
                          Reputasi: {si.reputation}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Tabs */}
              <div className="flex gap-1 px-6 py-3 border-b border-white/5">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.key
                        ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40"
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

              <div className="px-6 py-4">
                {activeTab === "apps" && (
                  <div className="space-y-2">
                    {data.top_apps.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-8">No application data for this device. It may not have active flows yet.</p>
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
                              {a.category && (
                                <span className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded">{a.category}</span>
                              )}
                              <span className="text-xs font-mono text-white">{fmtBytes(total)}</span>
                            </div>
                            <div className="flex gap-3 text-xs mb-2">
                              <span className="text-cyan-400">↓ {fmtBytes(a.download)}</span>
                              <span className="text-green-400">↑ {fmtBytes(a.upload)}</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
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
                      <p className="text-slate-500 text-sm text-center py-8">No active flows for this device.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left border-b border-white/10">
                            <th className="pb-2 text-xs font-medium text-slate-400">Destination IP</th>
                            <th className="pb-2 text-xs font-medium text-slate-400">Port</th>
                            <th className="pb-2 text-xs font-medium text-slate-400">App / Domain</th>
                            <th className="pb-2 text-xs font-medium text-slate-400">Protocol</th>
                            <th className="pb-2 text-xs font-medium text-slate-400 text-right">Download</th>
                            <th className="pb-2 text-xs font-medium text-slate-400 text-right">Upload</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {data.flows.map((f, i) => (
                            <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                              <td className="py-2 pr-4 font-mono text-xs text-blue-400">{f.dst_ip || "-"}</td>
                              <td className="py-2 pr-4 text-xs text-slate-400">{f.dst_port ?? "-"}</td>
                              <td className="py-2 pr-4 text-xs text-purple-300 max-w-[140px] truncate">
                                {(f as any).app_label || (f as any).domain || "-"}
                              </td>
                              <td className="py-2 pr-4 text-xs text-slate-300">{f.protocol || "-"}</td>
                              <td className="py-2 pr-4 text-right text-xs text-cyan-400">{fmtBytes(f.download)}</td>
                              <td className="py-2 text-right text-xs text-green-400">{fmtBytes(f.upload)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
