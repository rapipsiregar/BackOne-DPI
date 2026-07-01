"use client";

import { useState, useEffect } from "react";
import {
  fetchDeviceDetails, DeviceDetails,
} from "@/lib/api";
import { fmtBytes } from "@/lib/utils";
import { IpDetails } from "./IpDetails";
import {
  Loader2, X, Monitor, Globe, Activity, Lock, Server,
  AlertTriangle, Eye, Shield, Bell, Wifi, Unlock, Router,
  Link
} from "lucide-react";

interface Props {
  ip          : string;
  deviceLabel?: string | null;
  macAddress? : string | null;
  onClose     : () => void;
}

type Tab = "info" | "flows" | "apps" | "encryption" | "servers" | "passwords" | "reputation" | "vpn_events";

// ── helpers ───────────────────────────────────────────────────────────────────
function explainAppOrPort(appLabel: string | null, domain: string | null, port: number) {
  const label = appLabel || domain || "";
  const portStr = String(port);
  
  const matches: Record<string, string> = {
    "1433": "MSSQL Database Server",
    "1434": "MSSQL Monitor Server",
    "3306": "MySQL/MariaDB Database Server",
    "5432": "PostgreSQL Database Server",
    "1521": "Oracle Database Server",
    "27017": "MongoDB Database Server",
    "6379": "Redis Key-Value Cache",
    "80": "Unencrypted Web Traffic (HTTP)",
    "443": "Encrypted Web Traffic (HTTPS/TLS)",
    "22": "SSH Remote Management / SFTP",
    "21": "FTP File Upload/Download (Unencrypted)",
    "23": "Telnet Command Shell (Insecure)",
    "25": "SMTP Mail Delivery",
    "587": "Secure SMTP Mail Delivery",
    "110": "POP3 Mail Storage Retrieval",
    "993": "Secure IMAP Mail Service",
    "53": "DNS Server Query (Domain Lookup)",
    "123": "NTP Network Clock Synchronizer",
    "161": "SNMP Network Device Monitoring",
    "3389": "RDP Remote Desktop Management",
    "445": "SMB Windows File Sharing",
    "137": "NetBIOS Name Service",
    "138": "NetBIOS Datagram Service",
    "139": "NetBIOS Session Service",
    "1812": "RADIUS Authentication Server",
    "1813": "RADIUS Accounting Server"
  };

  let mainLabel = label;
  let subLabel = matches[portStr] || (label.toLowerCase().includes("tls") || label.toLowerCase().includes("https") ? "Encrypted Connection (SSL/TLS)" : "");

  if (appLabel && appLabel.includes("(") && domain && domain.startsWith("Port ")) {
    mainLabel = appLabel;
    subLabel = domain;
  }

  return {
    main: mainLabel || `Port ${port}`,
    sub: subLabel
  };
}

function sevStyle(sev: string | null) {
  switch ((sev || "").toLowerCase()) {
    case "critical": return "bg-red-500/15 text-red-400 ring-1 ring-red-500/30";
    case "high":     return "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30";
    case "warning":  return "bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/30";
    case "info":     return "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30";
    default:         return "bg-slate-700/40 text-slate-400";
  }
}

function riskStyle(lvl: string | null) {
  switch ((lvl || "").toLowerCase()) {
    case "critical":
    case "rawan":    return { bar: "bg-red-500",    badge: "bg-red-500/15 text-red-400 ring-1 ring-red-500/30" };
    case "medium":
    case "sedang":   return { bar: "bg-yellow-500", badge: "bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/30" };
    case "low":
    case "aman":     return { bar: "bg-green-500",  badge: "bg-green-500/15 text-green-400 ring-1 ring-green-500/30" };
    default:         return { bar: "bg-slate-500",  badge: "bg-slate-700/40 text-slate-400" };
  }
}

function TableWrap({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/5">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.02]">
            {head.map((h) => <th key={h} className="px-3 py-2 text-left font-medium text-slate-400 whitespace-nowrap">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">{children}</tbody>
      </table>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <p className="text-slate-500 text-sm text-center py-10">{msg}</p>;
}

// ── Main component ────────────────────────────────────────────────────────────
export function DeviceDetailModal({ ip, deviceLabel, macAddress, onClose }: Props) {
  const [data,      setData]      = useState<DeviceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("info");

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchDeviceDetails(ip)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [ip]);

  const di = data?.device_info;

  // Alert counts
  const alertCount =
    (data?.unencrypted_passwords.length ?? 0) +
    (data?.vpn_detections.length ?? 0) +
    (data?.events.filter(e => ["critical","high"].includes((e.severity||"").toLowerCase())).length ?? 0);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number; alert?: boolean }[] = [
    { key: "info",       label: "Info",         icon: <Monitor className="w-3.5 h-3.5" /> },
    { key: "flows",      label: "Flows",        icon: <Activity className="w-3.5 h-3.5" />, count: data?.flows.length },
    { key: "apps",       label: "Apps",         icon: <Globe className="w-3.5 h-3.5" />,    count: data?.top_apps.length },
    { key: "encryption", label: "Enkripsi",     icon: <Lock className="w-3.5 h-3.5" /> },
    { key: "servers",    label: "Servers",      icon: <Server className="w-3.5 h-3.5" />,   count: data?.server_discovery.length },
    { key: "passwords",  label: "Pwd Leaks",    icon: <Unlock className="w-3.5 h-3.5" />,   count: data?.unencrypted_passwords.length, alert: (data?.unencrypted_passwords.length ?? 0) > 0 },
    { key: "reputation", label: "Reputasi IP",  icon: <Eye className="w-3.5 h-3.5" />,      count: data?.ip_reputation.length },
    { key: "vpn_events", label: "VPN & Events", icon: <Bell className="w-3.5 h-3.5" />,     count: (data?.vpn_detections.length ?? 0) + (data?.events.length ?? 0), alert: alertCount > 0 },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div
        className="relative bg-[#0b0f16] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl shadow-black/70 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-cyan-900/30 to-teal-900/20 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg ring-1 ring-cyan-500/30">
              <Monitor className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {di?.device_label || deviceLabel || ip}
              </h3>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                <span className="text-xs text-cyan-400 font-mono">{ip}</span>
                {(di?.mac_address || macAddress) && (
                  <span className="text-xs text-slate-500 font-mono">{di?.mac_address || macAddress}</span>
                )}
                {di?.os_label && (
                  <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">{di.os_label}</span>
                )}
                {di?.device_type && (
                  <span className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded">{di.device_type}</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              <p className="text-slate-400 text-sm">Loading device data…</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-400 text-sm">{error}</div>
          ) : data ? (
            <>
              {/* ── KPI bar ── */}
              <div className="grid grid-cols-3 gap-3 px-6 py-3 border-b border-white/5 bg-white/[0.01] flex-shrink-0">
                {[
                  { label: "Download",   value: fmtBytes(data.total_download), color: "text-cyan-400" },
                  { label: "Upload",     value: fmtBytes(data.total_upload),   color: "text-green-400" },
                  { label: "Total Flows",value: data.flow_count,               color: "text-white" },
                ].map(k => (
                  <div key={k.label} className="text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{k.label}</p>
                    <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
                  </div>
                ))}
              </div>

              {/* ── Alert strip ── */}
              {alertCount > 0 && (
                <div className="mx-6 mt-3 flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span><strong>{alertCount}</strong> security alerts — cek tab <strong>Pwd Leaks</strong> atau <strong>VPN & Events</strong></span>
                </div>
              )}

              {/* ── MAC bandwidth strip ── */}
              {data.mac_bandwidth && (
                <div className="mx-6 mt-2 flex items-center gap-3 px-3 py-2 bg-white/[0.02] border border-white/5 rounded-lg text-xs">
                  <Wifi className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-400 font-mono">{data.mac_bandwidth.mac_address}</span>
                  <span className="text-slate-500">{data.mac_bandwidth.manufacturer || "Unknown"}</span>
                  <span className="ml-auto text-cyan-400">↓ {fmtBytes(data.mac_bandwidth.download)}</span>
                  <span className="text-green-400">↑ {fmtBytes(data.mac_bandwidth.upload)}</span>
                  <span className="text-slate-400 font-medium">Total: {fmtBytes(data.mac_bandwidth.total)}</span>
                </div>
              )}

              {/* ── Tabs ── */}
              <div className="flex gap-1 px-6 py-3 border-b border-white/5 flex-shrink-0 flex-wrap">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeTab === tab.key
                        ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${tab.alert ? "bg-red-500/20 text-red-300" : activeTab === tab.key ? "bg-cyan-500/30 text-cyan-200" : "bg-white/10 text-slate-300"}`}>
                        {tab.count}
                      </span>
                    )}
                    {tab.alert && tab.count === 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* ── Tab content ── */}
              <div className="px-6 py-4 space-y-4">

                {/* ══ INFO ══ */}
                {activeTab === "info" && (
                  <div className="space-y-4">
                    {/* Device identity card */}
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Informasi Device</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {[
                          { label: "Label",        value: di?.device_label },
                          { label: "Tipe",         value: di?.device_type },
                          { label: "OS",           value: di?.os_label },
                          { label: "Manufacturer", value: di?.manufacturer },
                          { label: "IP Address",   value: ip },
                          { label: "MAC Address",  value: di?.mac_address || macAddress },
                          { label: "Is New",       value: di?.is_new === 1 ? "Perangkat Baru ✨" : di?.is_new === 0 ? "Dikenal" : null },
                        ].filter(f => f.value).map(f => (
                          <div key={f.label} className="flex flex-col gap-0.5">
                            <span className="text-xs text-slate-500">{f.label}</span>
                            <span className="text-xs font-medium text-white font-mono">{String(f.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Top domains */}
                    {data.top_domains.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Top Domains Diakses</p>
                        <div className="space-y-1.5">
                          {data.top_domains.map((d, i) => {
                            const maxDl = Math.max(...data.top_domains.map(x => x.download), 1);
                            const pct = (d.download / maxDl) * 100;
                            return (
                              <div key={i} className="flex items-center gap-3 p-2 bg-white/[0.02] rounded-lg">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-slate-200 truncate font-mono">{d.domain}</p>
                                  <div className="h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full" style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                  <p className="text-xs text-cyan-400">{fmtBytes(d.download)}</p>
                                  <p className="text-[10px] text-slate-500">{d.flow_count} flows</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ══ FLOWS ══ */}
                {activeTab === "flows" && (
                  data.flows.length === 0 ? <Empty msg="Tidak ada flows untuk device ini." /> : (
                    <TableWrap head={["Destination IP", "Port", "Domain / App", "Proto", "↓", "↑", "Last Seen"]}>
                      {data.flows.map((f, i) => {
                        const exp = explainAppOrPort(f.app_label, f.domain, f.dst_port || 0);
                        return (
                          <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className="font-mono text-xs text-blue-400 block">{f.dst_ip || "—"}</span>
                              {f.dst_ip && <IpDetails ip={f.dst_ip} />}
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-400">{f.dst_port ?? "—"}</td>
                            <td className="px-3 py-2 max-w-[180px]">
                              <span className="text-xs text-teal-300 font-mono truncate block" title={exp.main}>
                                {exp.main}
                              </span>
                              {exp.sub && (
                                <span className="text-[10px] text-slate-500 block italic">{exp.sub}</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-400">{f.protocol || "—"}</td>
                            <td className="px-3 py-2 text-right text-xs text-cyan-400 whitespace-nowrap">{fmtBytes(f.download)}</td>
                            <td className="px-3 py-2 text-right text-xs text-green-400 whitespace-nowrap">{fmtBytes(f.upload)}</td>
                            <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">{f.last_seen?.slice(0, 16) || "—"}</td>
                          </tr>
                        );
                      })}
                    </TableWrap>
                  )
                )}

                {/* ══ APPS ══ */}
                {activeTab === "apps" && (
                  data.top_apps.length === 0
                    ? <Empty msg="Tidak ada data aplikasi / domain yang terdeteksi untuk device ini." />
                    : (
                      <div className="space-y-2">
                        {/* Legend */}
                        <div className="flex items-center gap-3 pb-1 mb-1 border-b border-white/5 flex-wrap">
                          <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <Globe className="w-3 h-3 text-teal-400" /> Domain / Website
                          </span>
                          <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <Shield className="w-3 h-3 text-blue-400" /> Protokol
                          </span>
                          <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <Link className="w-3 h-3 text-slate-500" /> Port
                          </span>
                        </div>

                        {data.top_apps.map((a, i) => {
                          const total    = a.download + a.upload;
                          const maxTotal = Math.max(...data.top_apps.map(x => x.download + x.upload), 1);
                          const pct      = (total / maxTotal) * 100;

                          const isDomain   = a.type === 'domain';
                          const isProtocol = a.type === 'protocol';

                          // Color scheme by type
                          const barColor   = isDomain ? 'from-teal-500 to-cyan-500'
                                           : isProtocol ? 'from-blue-500 to-indigo-500'
                                           : 'from-slate-600 to-slate-500';
                          const iconBg     = isDomain ? 'bg-teal-500/15' : isProtocol ? 'bg-blue-500/15' : 'bg-slate-700/40';
                          const iconColor  = isDomain ? 'text-teal-400' : isProtocol ? 'text-blue-400' : 'text-slate-500';

                          return (
                            <div key={i} className="p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-xl transition-colors">
                              <div className="flex items-start gap-3 mb-1.5">
                                {/* Icon */}
                                <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center ${iconBg}`}>
                                  {isDomain
                                    ? <Globe className={`w-3.5 h-3.5 ${iconColor}`} />
                                    : isProtocol
                                    ? <Shield className={`w-3.5 h-3.5 ${iconColor}`} />
                                    : <Link className={`w-3.5 h-3.5 ${iconColor}`} />}
                                </div>

                                {/* Label block */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {/* Main label: domain name or protocol */}
                                    <span className={`font-medium text-sm truncate max-w-[200px] ${
                                      isDomain ? 'text-teal-200 font-mono' : isProtocol ? 'text-blue-200' : 'text-slate-400'
                                    }`}>
                                      {a.label}
                                    </span>
                                    {/* Sub-label: protocol badge if domain */}
                                    {a.sub_label && (
                                      <span className="inline-flex text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20 flex-shrink-0">
                                        {a.sub_label}
                                      </span>
                                    )}
                                    {/* Type badge */}
                                    {isDomain && (
                                      <span className="inline-flex text-[10px] px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 flex-shrink-0">
                                        website
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Stats */}
                                <div className="text-right flex-shrink-0">
                                  <p className="text-xs font-mono text-white">{fmtBytes(total)}</p>
                                  <p className="text-[10px] text-slate-500">{a.flow_count} flows</p>
                                </div>
                              </div>

                              {/* Bandwidth breakdown */}
                              <div className="flex gap-3 text-xs mb-1.5 pl-10">
                                <span className="text-cyan-400">↓ {fmtBytes(a.download)}</span>
                                <span className="text-green-400">↑ {fmtBytes(a.upload)}</span>
                              </div>

                              {/* Progress bar */}
                              <div className="h-1 bg-white/5 rounded-full overflow-hidden ml-10">
                                <div
                                  className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                )}

                {/* ══ ENCRYPTION ══ */}
                {activeTab === "encryption" && (() => {
                  const enc = data.encryption;
                  if (!enc) return <Empty msg="Tidak ada data enkripsi untuk device ini." />;
                  const pct = enc.encrypted_pct ?? 0;
                  const { bar, badge } = riskStyle(enc.risk_level);
                  return (
                    <div className="space-y-4">
                      <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-sm font-semibold text-white">Status Enkripsi Traffic</p>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge}`}>
                            {enc.risk_level || "Unknown"}
                          </span>
                        </div>

                        {/* Big donut-style display */}
                        <div className="flex items-center gap-6 mb-4">
                          <div className="relative w-24 h-24 flex-shrink-0">
                            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ffffff10" strokeWidth="3" />
                              <circle
                                cx="18" cy="18" r="15.9" fill="none"
                                stroke={pct >= 80 ? "#22c55e" : pct >= 50 ? "#eab308" : "#ef4444"}
                                strokeWidth="3" strokeDasharray={`${pct} 100`} strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xl font-bold text-white">{pct}%</span>
                            </div>
                          </div>
                          <div className="flex-1 space-y-2">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">Terenkripsi</span>
                                <span className="text-green-400">{fmtBytes(enc.encrypted_bytes ?? 0)}</span>
                              </div>
                              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">Tidak Terenkripsi</span>
                                <span className="text-red-400">{fmtBytes(enc.unencrypted_bytes ?? 0)}</span>
                              </div>
                              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${100 - pct}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-xs text-slate-500 text-right">
                          Total: {fmtBytes(enc.total_bytes ?? 0)}
                        </div>
                      </div>

                      {/* Risk interpretation */}
                      <div className={`p-3 rounded-xl border ${
                        (enc.risk_level || "").toLowerCase().includes("critical") || (enc.risk_level || "").toLowerCase().includes("rawan")
                          ? "border-red-500/20 bg-red-500/5 text-red-300"
                          : (enc.risk_level || "").toLowerCase().includes("medium") || (enc.risk_level || "").toLowerCase().includes("sedang")
                          ? "border-yellow-500/20 bg-yellow-500/5 text-yellow-300"
                          : "border-green-500/20 bg-green-500/5 text-green-300"
                      } text-xs`}>
                        {(enc.risk_level || "").toLowerCase().includes("critical") || (enc.risk_level || "").toLowerCase().includes("rawan")
                          ? "🚨 Device ini memiliki risiko tinggi — sebagian besar traffic tidak terenkripsi!"
                          : (enc.risk_level || "").toLowerCase().includes("medium") || (enc.risk_level || "").toLowerCase().includes("sedang")
                          ? "⚠️ Traffic device ini sebagian tidak terenkripsi. Pertimbangkan upgrade ke HTTPS/TLS."
                          : "✅ Device ini memiliki enkripsi yang baik."}
                      </div>
                    </div>
                  );
                })()}

                {/* ══ SERVERS ══ */}
                {activeTab === "servers" && (
                  data.server_discovery.length === 0 ? <Empty msg="Tidak ada server yang terdeteksi untuk device ini." /> : (
                    <TableWrap head={["Server Type", "Hostname", "Port", "Protocol", "OS", "↓", "↑"]}>
                      {data.server_discovery.map((s, i) => (
                        <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/20">
                              {s.server_type || "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-300 font-mono truncate max-w-[140px]">{s.hostname || "—"}</td>
                          <td className="px-3 py-2 text-xs text-slate-400">{s.port ?? "—"}</td>
                          <td className="px-3 py-2 text-xs text-purple-300">{s.protocol || "—"}</td>
                          <td className="px-3 py-2 text-xs text-slate-500">{s.os_label || "—"}</td>
                          <td className="px-3 py-2 text-right text-xs text-cyan-400">{fmtBytes(s.download)}</td>
                          <td className="px-3 py-2 text-right text-xs text-green-400">{fmtBytes(s.upload)}</td>
                        </tr>
                      ))}
                    </TableWrap>
                  )
                )}

                {/* ══ PASSWORDS ══ */}
                {activeTab === "passwords" && (
                  data.unencrypted_passwords.length === 0
                    ? <div className="text-center py-10">
                        <p className="text-green-400 text-2xl mb-2">✅</p>
                        <p className="text-slate-400 text-sm">Tidak ada password cleartext yang terdeteksi.</p>
                      </div>
                    : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                          <AlertTriangle className="w-4 h-4" />
                          <span><strong>{data.unencrypted_passwords.length}</strong> koneksi dengan password tidak terenkripsi terdeteksi!</span>
                        </div>
                        <TableWrap head={["Destination IP", "Port", "Protocol", "Username", "Severity", "↓"]}>
                          {data.unencrypted_passwords.map((p, i) => (
                            <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                              <td className="px-3 py-2 whitespace-nowrap">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-mono text-xs text-red-400">{p.dst_ip || "—"}</span>
                                  {p.dst_ip && <IpDetails ip={p.dst_ip} />}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-xs text-slate-400">{p.dst_port ?? "—"}</td>
                              <td className="px-3 py-2 text-xs text-slate-300">{p.protocol || "—"}</td>
                              <td className="px-3 py-2 text-xs text-yellow-300 font-mono">{p.username || "—"}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sevStyle(p.severity)}`}>
                                  {p.severity || "—"}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right text-xs text-cyan-400">{fmtBytes(p.download)}</td>
                            </tr>
                          ))}
                        </TableWrap>
                      </div>
                    )
                )}

                {/* ══ REPUTATION ══ */}
                {activeTab === "reputation" && (
                  data.ip_reputation.length === 0 ? <Empty msg="Tidak ada data reputasi IP untuk device ini." /> : (
                    <TableWrap head={["Remote IP", "Reputation", "Score", "Country", "App", "Blacklisted", "↓"]}>
                      {data.ip_reputation.map((r, i) => (
                        <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-mono text-xs text-red-400">{r.remote_ip || "—"}</span>
                              {r.remote_ip && <IpDetails ip={r.remote_ip} />}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-300">{r.reputation || "—"}</td>
                          <td className="px-3 py-2 text-xs text-yellow-400">{r.score ?? "—"}</td>
                          <td className="px-3 py-2 text-xs text-slate-400">{r.country || "—"}</td>
                          <td className="px-3 py-2 text-xs text-purple-300 truncate max-w-[80px]">{r.app_label || "—"}</td>
                          <td className="px-3 py-2 text-xs">
                            {r.blacklisted
                              ? <span className="text-red-400 font-semibold">⛔ Yes</span>
                              : <span className="text-green-400">✓ No</span>}
                          </td>
                          <td className="px-3 py-2 text-right text-xs text-cyan-400">{fmtBytes(r.download)}</td>
                        </tr>
                      ))}
                    </TableWrap>
                  )
                )}

                {/* ══ VPN & EVENTS ══ */}
                {activeTab === "vpn_events" && (
                  <div className="space-y-6">
                    {/* VPN */}
                    <section>
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                        <Shield className="w-4 h-4 text-blue-400" /> Deteksi VPN
                        <span className="ml-auto text-xs text-slate-500">{data.vpn_detections.length} records</span>
                      </h4>
                      {data.vpn_detections.length === 0 ? (
                        <p className="text-slate-500 text-xs">Tidak ada penggunaan VPN yang terdeteksi.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {data.vpn_detections.map((v, i) => (
                            <div key={i} className="p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl text-xs space-y-1">
                              <div className="flex justify-between">
                                <span className="text-blue-400 font-medium">{v.vpn_type || "Unknown VPN"}</span>
                                <span className="text-slate-500">{v.country || "—"}</span>
                              </div>
                              {v.remote_ip && (
                                <div className="text-slate-400 font-mono flex flex-col gap-0.5 mt-0.5">
                                  <span>→ {v.remote_ip}</span>
                                  <IpDetails ip={v.remote_ip} />
                                </div>
                              )}
                              <div className="flex gap-2 text-slate-500">
                                <span>{v.protocol || "—"}</span>
                                {v.confidence !== null && v.confidence !== undefined && (
                                  <span className="ml-auto text-purple-400">
                                    Conf: {((v.confidence) * 100).toFixed(0)}%
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>

                    {/* Events */}
                    <section>
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                        <Bell className="w-4 h-4 text-yellow-400" /> Security Events
                        <span className="ml-auto text-xs text-slate-500">{data.events.length} records</span>
                      </h4>
                      {data.events.length === 0 ? (
                        <p className="text-slate-500 text-xs">Tidak ada security events untuk device ini.</p>
                      ) : (
                        <div className="space-y-2">
                          {data.events.map((ev, i) => (
                            <div key={i} className={`p-3 rounded-xl border text-xs ${
                              (ev.severity || "").toLowerCase() === "critical" ? "bg-red-500/5 border-red-500/20" :
                              (ev.severity || "").toLowerCase() === "high" ? "bg-orange-500/5 border-orange-500/15" :
                              "bg-white/[0.02] border-white/5"
                            }`}>
                              <div className="flex items-start gap-2">
                                <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${sevStyle(ev.severity)}`}>
                                  {ev.severity || "Info"}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-white">{ev.event_type || "Unknown"}</p>
                                  {ev.description && <p className="text-slate-400 mt-0.5 leading-relaxed">{ev.description}</p>}
                                </div>
                                <span className="text-slate-600 flex-shrink-0">{ev.event_at?.slice(0, 16) || "—"}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
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
