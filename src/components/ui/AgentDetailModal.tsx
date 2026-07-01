"use client";

import { useState, useEffect } from "react";
import { fetchAgentDetails, AgentDetails } from "@/lib/api";
import { fmtBytes } from "@/lib/utils";
import { DeviceDetailModal } from "@/components/ui/DeviceDetailModal";
import { IpDetails } from "@/components/ui/IpDetails";
import {
  Loader2, X, Server, Monitor, Activity, Globe, Shield,
  Bell, Wifi, AlertTriangle, Lock, Unlock, ChevronRight,
  Eye, Router
} from "lucide-react";

interface Props {
  agentUuid: string;
  agentLabel: string;
  onClose: () => void;
}

type Tab = "devices" | "flows" | "apps" | "security" | "events" | "mac";

// ── Severity colour helper ─────────────────────────────────────────────────
function severityStyle(sev: string | null) {
  switch ((sev || "").toLowerCase()) {
    case "critical": return { badge: "bg-red-500/15 text-red-400 ring-red-500/30", dot: "bg-red-400" };
    case "high":     return { badge: "bg-orange-500/15 text-orange-400 ring-orange-500/30", dot: "bg-orange-400" };
    case "warning":  return { badge: "bg-yellow-500/15 text-yellow-400 ring-yellow-500/30", dot: "bg-yellow-400" };
    case "info":     return { badge: "bg-blue-500/15 text-blue-400 ring-blue-500/30", dot: "bg-blue-400" };
    default:         return { badge: "bg-slate-500/15 text-slate-400 ring-slate-500/30", dot: "bg-slate-400" };
  }
}

function riskStyle(level: string | null) {
  switch ((level || "").toLowerCase()) {
    case "rawan":
    case "critical": return { badge: "bg-red-500/15 text-red-400 ring-red-500/30", dot: "bg-red-400" };
    case "sedang":
    case "medium":   return { badge: "bg-yellow-500/15 text-yellow-400 ring-yellow-500/30", dot: "bg-yellow-400" };
    case "aman":
    case "low":      return { badge: "bg-green-500/15 text-green-400 ring-green-500/30", dot: "bg-green-400" };
    default:         return { badge: "bg-slate-500/15 text-slate-400 ring-slate-500/30", dot: "bg-slate-400" };
  }
}

// ── Shared table wrapper ────────────────────────────────────────────────────
function TableWrap({ children, head }: { children: React.ReactNode; head: string[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/5">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.02]">
            {head.map((h) => (
              <th key={h} className="px-3 py-2 text-left font-medium text-slate-400 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">{children}</tbody>
      </table>
    </div>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return <p className="text-slate-500 text-sm text-center py-10">{msg}</p>;
}

// ── Main component ──────────────────────────────────────────────────────────
export function AgentDetailModal({ agentUuid, agentLabel, onClose }: Props) {
  const [data,      setData]      = useState<AgentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("devices");
  const [selectedDevice, setSelectedDevice] = useState<{ ip: string; label: string | null; mac: string | null } | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchAgentDetails(agentUuid)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [agentUuid]);

  // Count security alerts
  const secCount = data
    ? (data.security?.insecure_protocols?.length ?? 0) +
      (data.security?.unencrypted_passwords?.length ?? 0) +
      (data.security?.tor_detections?.length ?? 0) +
      (data.security?.vpn_detections?.length ?? 0)
    : 0;

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "devices",  label: "Devices",      icon: <Monitor className="w-3.5 h-3.5" />,       count: data?.devices.length },
    { key: "flows",    label: "Flows",         icon: <Activity className="w-3.5 h-3.5" />,      count: data?.flows.length },
    { key: "apps",     label: "Top Apps",      icon: <Globe className="w-3.5 h-3.5" />,         count: data?.top_apps.length },
    { key: "security", label: "Security",      icon: <Shield className="w-3.5 h-3.5" />,        count: secCount || undefined },
    { key: "events",   label: "Events",        icon: <Bell className="w-3.5 h-3.5" />,          count: data?.events.length },
    { key: "mac",      label: "MAC Bandwidth", icon: <Wifi className="w-3.5 h-3.5" />,          count: data?.mac_bandwidth.length },
  ];

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl shadow-black/60 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-blue-900/30 to-purple-900/20 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg ring-1 ring-blue-500/30">
              <Server className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{agentLabel}</h3>
              <p className="text-xs text-slate-400 font-mono">{agentUuid}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              <p className="text-slate-400 text-sm">Loading agent data…</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-400 text-sm">{error}</div>
          ) : data ? (
            <>
              {/* ── KPI row ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-4 border-b border-white/5 flex-shrink-0">
                {[
                  { label: "Devices",    value: data.devices.length,                           color: "text-white" },
                  { label: "Flows",      value: data.summary?.active_flows ?? data.flows.length, color: "text-white" },
                  { label: "Download",   value: fmtBytes(data.summary?.bandwidth_down ?? 0),    color: "text-cyan-400" },
                  { label: "Upload",     value: fmtBytes(data.summary?.bandwidth_up   ?? 0),    color: "text-green-400" },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-xs text-slate-400 mb-1">{kpi.label}</p>
                    <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                  </div>
                ))}
              </div>

              {/* ── Security alert strip ── */}
              {secCount > 0 && (
                <div className="mx-6 mt-3 flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span><strong>{secCount}</strong> security alerts detected on this agent — check the Security tab</span>
                </div>
              )}

              {/* ── Tabs ── */}
              <div className="flex gap-1 px-6 py-3 border-b border-white/5 flex-shrink-0 flex-wrap">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeTab === tab.key
                        ? "bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/40"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`ml-0.5 px-1.5 py-0.5 rounded text-xs ${activeTab === tab.key ? "bg-blue-500/30 text-blue-200" : "bg-white/10 text-slate-300"}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* ── Tab content ── */}
              <div className="px-6 py-4 space-y-4">

                {/* DEVICES */}
                {activeTab === "devices" && (
                  data.devices.length === 0 ? <EmptyState msg="No devices found for this agent." /> : (
                    <div className="space-y-2">
                      {data.devices.map((d, i) => {
                        const rc = riskStyle(d.risk_level);
                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedDevice({ ip: d.ip_address || "", label: d.device_label, mac: d.mac_address })}
                            className="w-full text-left p-3 bg-white/[0.03] hover:bg-white/[0.07] hover:border-cyan-500/30 border border-white/5 rounded-xl transition-all group cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 p-2 bg-slate-800/60 group-hover:bg-cyan-500/10 rounded-lg transition-colors">
                                <Monitor className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium text-white text-sm truncate group-hover:text-cyan-300 transition-colors">{d.device_label || d.ip_address || "Unknown"}</p>
                                  {d.risk_level && (
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${rc.badge}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />
                                      {d.risk_level}
                                    </span>
                                  )}
                                  {d.has_insecure && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ring-1 bg-orange-500/10 ring-orange-500/30 text-orange-400">
                                      ⚠ Insecure
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                  <p className="text-xs text-slate-400 font-mono">{d.ip_address}</p>
                                  {d.mac_address && <p className="text-xs text-slate-500 font-mono">{d.mac_address}</p>}
                                  {d.os_label && <p className="text-xs text-blue-400">{d.os_label}</p>}
                                  {d.manufacturer && <p className="text-xs text-slate-500">{d.manufacturer}</p>}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 space-y-0.5">
                                <p className="text-xs text-cyan-400">↓ {fmtBytes(d.download ?? 0)}</p>
                                <p className="text-xs text-green-400">↑ {fmtBytes(d.upload ?? 0)}</p>
                                {d.encrypted_pct !== null && (
                                  <p className="text-xs text-slate-500">🔒 {d.encrypted_pct}%</p>
                                )}
                                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 ml-auto transition-colors" />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )
                )}

                {/* FLOWS */}
                {activeTab === "flows" && (
                  data.flows.length === 0 ? <EmptyState msg="No flows found for this agent." /> : (
                    <TableWrap head={["Source IP", "Destination", "App / Domain", "Proto", "↓", "↑", "Last Seen"]}>
                      {data.flows.map((f, i) => (
                        <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                          <td className="px-3 py-2 font-mono text-xs text-blue-400 whitespace-nowrap">{f.src_ip || "—"}</td>
                           <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-mono text-xs text-slate-300">
                                {f.dst_ip || "—"}{f.dst_port ? <span className="text-slate-500">:{f.dst_port}</span> : ""}
                              </span>
                              {f.dst_ip && <IpDetails ip={f.dst_ip} />}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-xs text-purple-300 max-w-[140px] truncate">{f.app_label || f.domain || "—"}</td>
                          <td className="px-3 py-2 text-xs text-slate-400">{f.protocol || "—"}</td>
                          <td className="px-3 py-2 text-right text-xs text-cyan-400 whitespace-nowrap">{fmtBytes(f.download)}</td>
                          <td className="px-3 py-2 text-right text-xs text-green-400 whitespace-nowrap">{fmtBytes(f.upload)}</td>
                          <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">{f.last_seen?.slice(0, 16) || "—"}</td>
                        </tr>
                      ))}
                    </TableWrap>
                  )
                )}

                {/* TOP APPS */}
                {activeTab === "apps" && (
                  data.top_apps.length === 0 ? <EmptyState msg="No application data for this agent." /> : (
                    <div className="space-y-2">
                      {data.top_apps.map((a, i) => {
                        const total   = (a.download ?? 0) + (a.upload ?? 0);
                        const maxTotal = Math.max(...data.top_apps.map(x => (x.download ?? 0) + (x.upload ?? 0)), 1);
                        const pct     = (total / maxTotal) * 100;
                        return (
                          <div key={i} className="p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-xl transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                              {a.favicon
                                ? <img src={a.favicon} alt={a.app_label} className="w-5 h-5 rounded bg-white p-0.5 flex-shrink-0" />
                                : <div className="w-5 h-5 rounded bg-slate-700 flex-shrink-0" />
                              }
                              <span className="font-medium text-white text-sm flex-1">{a.app_label}</span>
                              {a.category && <span className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded">{a.category}</span>}
                              <span className="text-xs font-mono text-white">{fmtBytes(total)}</span>
                            </div>
                            <div className="flex gap-3 text-xs text-slate-400 mb-2">
                              <span className="text-cyan-400">↓ {fmtBytes(a.download ?? 0)}</span>
                              <span className="text-green-400">↑ {fmtBytes(a.upload ?? 0)}</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}

                {/* SECURITY */}
                {activeTab === "security" && (
                  <div className="space-y-6">
                    {/* Encryption Audit */}
                    <section>
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                        <Lock className="w-4 h-4 text-blue-400" /> Encryption Audit
                        <span className="ml-auto text-xs text-slate-500">{data.security?.encryption_audit.length ?? 0} devices</span>
                      </h4>
                      {(data.security?.encryption_audit.length ?? 0) === 0 ? <EmptyState msg="No encryption audit data for this agent." /> : (
                        <TableWrap head={["IP Address", "Device", "Encrypted %", "Risk", "Enc Bytes", "Unenc Bytes"]}>
                          {data.security!.encryption_audit.map((r, i) => {
                            const rc = riskStyle(r.risk_level);
                            return (
                              <tr key={i} className="hover:bg-white/[0.03]">
                                <td className="px-3 py-2 font-mono text-xs text-blue-400">{r.ip_address || "—"}</td>
                                <td className="px-3 py-2 text-xs text-slate-300 truncate max-w-[120px]">{r.device_label || "—"}</td>
                                <td className="px-3 py-2 text-xs">
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${r.encrypted_pct ?? 0}%` }} />
                                    </div>
                                    <span className="text-white">{r.encrypted_pct ?? 0}%</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ring-1 ${rc.badge}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />
                                    {r.risk_level || "—"}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-xs text-cyan-400">{fmtBytes(r.encrypted ?? 0)}</td>
                                <td className="px-3 py-2 text-xs text-orange-400">{fmtBytes(r.unencrypted ?? 0)}</td>
                              </tr>
                            );
                          })}
                        </TableWrap>
                      )}
                    </section>

                    {/* Insecure Protocols */}
                    <section>
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                        <Unlock className="w-4 h-4 text-orange-400" /> Insecure Protocols
                        <span className="ml-auto text-xs text-slate-500">{data.security?.insecure_protocols.length ?? 0} records</span>
                      </h4>
                      {(data.security?.insecure_protocols.length ?? 0) === 0 ? <EmptyState msg="No insecure protocols detected for this agent." /> : (
                        <TableWrap head={["IP", "Protocol", "Risk", "App", "Dst IP:Port", "↓", "↑"]}>
                          {data.security!.insecure_protocols.map((r, i) => {
                            const sc = severityStyle(r.risk);
                            return (
                              <tr key={i} className="hover:bg-white/[0.03]">
                                <td className="px-3 py-2 font-mono text-xs text-blue-400">{r.ip_address || "—"}</td>
                                <td className="px-3 py-2 text-xs text-slate-200">{r.protocol || "—"}</td>
                                <td className="px-3 py-2">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ring-1 ${sc.badge}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                    {r.risk || "—"}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-xs text-purple-300 truncate max-w-[100px]">{r.app_label || "—"}</td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-mono text-xs text-slate-400">
                                      {r.dst_ip ? `${r.dst_ip}:${r.dst_port ?? "?"}` : "—"}
                                    </span>
                                    {r.dst_ip && <IpDetails ip={r.dst_ip} />}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-right text-xs text-cyan-400">{fmtBytes(r.download)}</td>
                                <td className="px-3 py-2 text-right text-xs text-green-400">{fmtBytes(r.upload)}</td>
                              </tr>
                            );
                          })}
                        </TableWrap>
                      )}
                    </section>

                    {/* Unencrypted Passwords */}
                    {(data.security?.unencrypted_passwords.length ?? 0) > 0 && (
                      <section>
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-red-400 mb-3">
                          <AlertTriangle className="w-4 h-4" /> Unencrypted Passwords Detected!
                          <span className="ml-auto text-xs text-slate-500">{data.security!.unencrypted_passwords.length} records</span>
                        </h4>
                        <TableWrap head={["IP", "Dst IP:Port", "Protocol", "Username", "Severity"]}>
                          {data.security!.unencrypted_passwords.map((r, i) => {
                            const sc = severityStyle(r.severity);
                            return (
                              <tr key={i} className="hover:bg-white/[0.03]">
                                <td className="px-3 py-2 font-mono text-xs text-blue-400">{r.ip_address || "—"}</td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-mono text-xs text-slate-400">
                                      {r.dst_ip ? `${r.dst_ip}:${r.dst_port ?? "?"}` : "—"}
                                    </span>
                                    {r.dst_ip && <IpDetails ip={r.dst_ip} />}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-xs text-slate-300">{r.protocol || "—"}</td>
                                <td className="px-3 py-2 text-xs text-yellow-300 font-mono">{r.username || "—"}</td>
                                <td className="px-3 py-2">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ring-1 ${sc.badge}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                    {r.severity || "—"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </TableWrap>
                      </section>
                    )}

                    {/* IP Reputation */}
                    {(data.security?.ip_reputation.length ?? 0) > 0 && (
                      <section>
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                          <Eye className="w-4 h-4 text-purple-400" /> IP Reputation
                          <span className="ml-auto text-xs text-slate-500">{data.security!.ip_reputation.length} records</span>
                        </h4>
                        <TableWrap head={["Remote IP", "Local IP", "Reputation", "Score", "Country", "Blacklisted"]}>
                          {data.security!.ip_reputation.map((r, i) => (
                            <tr key={i} className="hover:bg-white/[0.03]">
                              <td className="px-3 py-2 font-mono text-xs text-red-400">{r.ip_address || "—"}</td>
                              <td className="px-3 py-2 font-mono text-xs text-blue-400">{r.local_ip || "—"}</td>
                              <td className="px-3 py-2 text-xs text-slate-300">{r.reputation || "—"}</td>
                              <td className="px-3 py-2 text-xs text-yellow-400">{r.score ?? "—"}</td>
                              <td className="px-3 py-2 text-xs text-slate-400">{r.country || "—"}</td>
                              <td className="px-3 py-2 text-xs">
                                {r.blacklisted
                                  ? <span className="text-red-400 font-semibold">⛔ Yes</span>
                                  : <span className="text-green-400">✓ No</span>
                                }
                              </td>
                            </tr>
                          ))}
                        </TableWrap>
                      </section>
                    )}

                    {/* Tor & VPN side-by-side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Tor */}
                      <section>
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                          <Router className="w-4 h-4 text-red-400" /> Tor Detections
                          <span className="ml-auto text-xs text-slate-500">{data.security?.tor_detections.length ?? 0}</span>
                        </h4>
                        {(data.security?.tor_detections.length ?? 0) === 0
                          ? <EmptyState msg="No Tor usage detected." />
                          : <div className="space-y-2">{data.security!.tor_detections.map((r, i) => (
                              <div key={i} className="p-2 bg-red-500/5 border border-red-500/20 rounded-lg text-xs">
                                <div className="flex justify-between">
                                  <span className="font-mono text-blue-400">{r.ip_address || "—"}</span>
                                  <span className="text-slate-400">{r.country || "—"}</span>
                                </div>
                                <div className="text-slate-500 mt-0.5">Exit: {r.exit_node || "—"}</div>
                              </div>
                            ))}</div>
                        }
                      </section>

                      {/* VPN */}
                      <section>
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                          <Shield className="w-4 h-4 text-blue-400" /> VPN Detections
                          <span className="ml-auto text-xs text-slate-500">{data.security?.vpn_detections.length ?? 0}</span>
                        </h4>
                        {(data.security?.vpn_detections.length ?? 0) === 0
                          ? <EmptyState msg="No VPN usage detected." />
                          : <div className="space-y-2">{data.security!.vpn_detections.map((r, i) => (
                              <div key={i} className="p-2 bg-blue-500/5 border border-blue-500/20 rounded-lg text-xs">
                                <div className="flex justify-between">
                                  <span className="font-mono text-blue-400">{r.ip_address || "—"}</span>
                                  <span className="text-purple-400">{r.vpn_type || "—"}</span>
                                </div>
                                 <div className="text-slate-500 mt-0.5 flex flex-col gap-0.5">
                                   <span>Remote: {r.remote_ip || "—"} • {r.country || "—"}</span>
                                   {r.remote_ip && <IpDetails ip={r.remote_ip} />}
                                 </div>
                                {r.confidence && <div className="text-slate-500">Confidence: {(r.confidence * 100).toFixed(0)}%</div>}
                              </div>
                            ))}</div>
                        }
                      </section>
                    </div>

                    {/* Server Discovery */}
                    {(data.server_discovery?.length ?? 0) > 0 && (
                      <section>
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                          <Server className="w-4 h-4 text-cyan-400" /> Servers Discovered
                          <span className="ml-auto text-xs text-slate-500">{data.server_discovery!.length} records</span>
                        </h4>
                        <TableWrap head={["IP", "Hostname", "Server Type", "Port", "Protocol", "OS"]}>
                          {data.server_discovery!.map((r, i) => (
                            <tr key={i} className="hover:bg-white/[0.03]">
                               <td className="px-3 py-2 whitespace-nowrap">
                                 <div className="flex flex-col gap-0.5">
                                   <span className="font-mono text-xs text-blue-400">{r.ip_address || "—"}</span>
                                   {r.ip_address && <IpDetails ip={r.ip_address} />}
                                 </div>
                               </td>
                              <td className="px-3 py-2 text-xs text-slate-300 truncate max-w-[120px]">{r.hostname || "—"}</td>
                              <td className="px-3 py-2 text-xs text-cyan-400">{r.server_type || "—"}</td>
                              <td className="px-3 py-2 text-xs text-slate-400">{r.port ?? "—"}</td>
                              <td className="px-3 py-2 text-xs text-purple-300">{r.protocol || "—"}</td>
                              <td className="px-3 py-2 text-xs text-slate-500">{r.os_label || "—"}</td>
                            </tr>
                          ))}
                        </TableWrap>
                      </section>
                    )}
                  </div>
                )}

                {/* EVENTS */}
                {activeTab === "events" && (
                  data.events.length === 0 ? <EmptyState msg="No events found for this agent." /> : (
                    <div className="space-y-2">
                      {data.events.map((ev, i) => {
                        const sc = severityStyle(ev.severity);
                        return (
                          <div key={i} className={`p-3 border rounded-xl text-xs transition-colors ${
                            (ev.severity || "").toLowerCase() === "critical" ? "bg-red-500/5 border-red-500/20 hover:bg-red-500/10" :
                            (ev.severity || "").toLowerCase() === "high"     ? "bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10" :
                            "bg-white/[0.03] border-white/5 hover:bg-white/[0.06]"
                          }`}>
                            <div className="flex items-start gap-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ring-1 flex-shrink-0 ${sc.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                {ev.severity || "—"}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="font-semibold text-white">{ev.event_type || "Unknown"}</span>
                                  <span className="font-mono text-blue-400">{ev.ip_address || "—"}</span>
                                  {ev.mac_address && <span className="font-mono text-slate-500">{ev.mac_address}</span>}
                                </div>
                                {ev.description && <p className="text-slate-400 leading-relaxed">{ev.description}</p>}
                              </div>
                              <span className="text-slate-600 flex-shrink-0 whitespace-nowrap">{ev.event_at?.slice(0, 16) || "—"}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}

                {/* MAC BANDWIDTH */}
                {activeTab === "mac" && (
                  data.mac_bandwidth.length === 0 ? <EmptyState msg="No MAC bandwidth data for this agent." /> : (
                    <div className="space-y-2">
                      {data.mac_bandwidth.map((m, i) => {
                        const maxTotal = Math.max(...data.mac_bandwidth.map(x => x.total ?? 0), 1);
                        const pct = ((m.total ?? 0) / maxTotal) * 100;
                        return (
                          <div key={i} className="p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-xl transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                              <Wifi className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-mono text-xs text-slate-200">{m.mac_address}</p>
                                <p className="text-xs text-slate-500">{m.manufacturer || "Unknown Manufacturer"}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-xs text-white font-medium">{fmtBytes(m.total ?? 0)}</p>
                                <p className="text-xs text-slate-500">Total</p>
                              </div>
                            </div>
                            <div className="flex gap-4 text-xs mb-2">
                              <span className="text-cyan-400">↓ {fmtBytes(m.download ?? 0)}</span>
                              <span className="text-green-400">↑ {fmtBytes(m.upload ?? 0)}</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}

              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
    {selectedDevice && selectedDevice.ip && (
      <DeviceDetailModal
        ip={selectedDevice.ip}
        deviceLabel={selectedDevice.label}
        macAddress={selectedDevice.mac}
        onClose={() => setSelectedDevice(null)}
      />
    )}
    </>
  );
}
