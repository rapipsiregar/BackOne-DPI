"use client";

import { useState, useEffect } from "react";
import { fetchDeviceDetails, DeviceDetails, DeviceStat } from "@/lib/api";
import { useTimeFilter } from "@/contexts/TimeFilterContext";
import { fmtBytes } from "@/lib/utils";
import { Loader2, X, Monitor, Activity, Shield, Box, Server, Cpu, Clock, HardDrive, ArrowDownToLine, ArrowUpFromLine, RefreshCcw, Globe, Link2 } from "lucide-react";

const PORT_ALIASES: Record<string, string> = {
  "20": "FTP Data",
  "21": "FTP Control",
  "22": "SSH",
  "23": "Telnet",
  "25": "SMTP",
  "53": "DNS",
  "67": "DHCP Server",
  "68": "DHCP Client",
  "80": "HTTP",
  "110": "POP3",
  "123": "NTP",
  "143": "IMAP",
  "161": "SNMP",
  "443": "HTTPS",
  "445": "SMB",
  "500": "IKE/IPsec",
  "1433": "MS SQL Server",
  "1521": "Oracle DB",
  "3306": "MySQL",
  "3389": "RDP",
  "5432": "PostgreSQL",
  "6379": "Redis",
  "8080": "HTTP Alternate",
  "8443": "HTTPS Alternate",
  "5222": "XMPP/Jabber"
};

function formatProtocolLabel(label: string) {
  if (label.startsWith("Port ")) {
    const portNum = label.split(" ")[1];
    
    // Check known aliases
    if (PORT_ALIASES[portNum]) {
      return `Port ${portNum} (${PORT_ALIASES[portNum]})`;
    }
    
    // Check ephemeral range (49152 to 65535)
    const portInt = parseInt(portNum, 10);
    if (!isNaN(portInt)) {
      if (portInt >= 49152 && portInt <= 65535) {
        return `Port ${portNum} (Ephemeral/Dynamic)`;
      } else {
        return `Port ${portNum} (Unassigned/Other)`;
      }
    }
  }
  return label;
}

function formatActiveDuration(firstSeen?: string, lastSeen?: string) {
  if (!firstSeen || !lastSeen) return null;
  const start = new Date(firstSeen).getTime();
  const end = new Date(lastSeen).getTime();
  const now = Date.now();
  
  const dateObj = new Date(lastSeen);
  const fullTimestamp = dateObj.toLocaleString("id-ID", {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  let diffSec = Math.floor((end - start) / 1000);
  if (diffSec < 0) diffSec = 0;
  
  const h = Math.floor(diffSec / 3600);
  const m = Math.floor((diffSec % 3600) / 60);
  const s = diffSec % 60;
  
  let durationText = "Just now";
  if (h > 0) durationText = `${h}h ${m}m ${s}s`;
  else if (m > 0) durationText = `${m}m ${s}s`;
  else if (s > 0) durationText = `${s}s`;

  // If last seen was within 5 minutes (300 seconds), consider it Active
  const timeSinceLastSeen = Math.floor((now - end) / 1000);
  const isActive = timeSinceLastSeen <= 300;
  
  let lastSeenText = "";
  if (!isActive) {
    const agoH = Math.floor(timeSinceLastSeen / 3600);
    const agoM = Math.floor((timeSinceLastSeen % 3600) / 60);
    if (agoH > 24) {
      const agoD = Math.floor(agoH / 24);
      lastSeenText = `${agoD}d ago`;
    } else if (agoH > 0) {
      lastSeenText = `${agoH}h ago`;
    } else if (agoM > 0) {
      lastSeenText = `${agoM}m ago`;
    } else {
      lastSeenText = "a few seconds ago";
    }
  }

  return {
    isActive,
    durationText,
    fullTimestamp,
    lastSeenText
  };
}

function ActiveDurationDisplay({ firstSeen, lastSeen }: { firstSeen?: string, lastSeen?: string }) {
  if (!firstSeen || !lastSeen) return null;
  const dur = formatActiveDuration(firstSeen, lastSeen);
  if (!dur) return null;

  return (
    <div className="flex flex-col gap-1.5 bg-black/20 p-2.5 rounded-lg border border-white/5 mb-3">
      <div className="flex justify-between text-xs items-center">
        <span className={`flex items-center gap-1.5 ${dur.isActive ? 'text-blue-400' : 'text-slate-400'}`}>
          <Clock className="w-3.5 h-3.5" /> {dur.isActive ? "Active" : "Last seen"}
        </span>
        <span className="text-slate-300 font-medium">
          {dur.isActive ? dur.durationText : dur.lastSeenText}
        </span>
      </div>
      <div className="text-[10px] text-slate-500 text-right">
        {dur.fullTimestamp}
      </div>
    </div>
  );
}

interface Props {
  ip: string;
  deviceData?: DeviceStat;
  onClose: () => void;
}

type Tab = "info" | "apps" | "protocols" | "domains" | "flows" | "threats";

export function DeviceDetailModal({ ip, deviceData, onClose }: Props) {
  const [data, setData] = useState<DeviceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const { timeRange } = useTimeFilter();

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 480);
  };

  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    
    setError(null);
    try {
      const res = await fetchDeviceDetails(ip, timeRange);
      setData(res);
    } catch (e: any) {
      if (!silent) setError(e.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // Real-time polling every 5 seconds
    const interval = setInterval(() => {
      loadData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [ip, timeRange]);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "info", label: "Overview", icon: Monitor },
    { id: "apps", label: "Applications", icon: Box },
    { id: "protocols", label: "Protocols", icon: Link2 },
    { id: "domains", label: "Domains / Web", icon: Globe },
    { id: "flows", label: "Network Flows", icon: Activity },
    { id: "threats", label: "Threats", icon: Shield }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className={`absolute inset-0 bg-black/60 backdrop-blur-md ${isClosing ? 'animate-overlay-out' : 'animate-overlay-in'}`} />
      <div
        className={`relative bg-slate-950/80 border border-slate-800/60 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl shadow-blue-900/20 overflow-hidden backdrop-blur-xl ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Top Glow */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-gradient-to-br from-blue-900/10 via-slate-900/20 to-slate-950/40 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full" />
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-xl ring-1 ring-blue-500/30 relative">
                <Monitor className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-white tracking-tight">{ip}</h3>
                {isRefreshing && <RefreshCcw className="w-3.5 h-3.5 text-blue-400 animate-spin" />}
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                {data?.device_label || deviceData?.device_label || 'Unknown Device'} 
                <span className="text-slate-600 mx-2">•</span> 
                <span className="font-mono text-xs">{data?.mac_address || deviceData?.mac_address || 'No MAC'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 min-h-0 bg-gradient-to-b from-transparent to-slate-950/50 relative z-10">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              <p className="text-slate-400 font-medium">Gathering device telemetry...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 max-w-md">
                <X className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <h4 className="text-red-400 font-bold text-lg mb-1">Failed to Load</h4>
                <p className="text-red-300/70 text-sm">{error}</p>
              </div>
            </div>
          ) : data ? (
            <>
              {/* Tab Navigation */}
              <div className="flex items-center gap-2 px-6 py-3 border-b border-white/5 overflow-x-auto custom-scrollbar flex-shrink-0 bg-black/20">
                {tabs.map((t) => {
                  const Icon = t.icon;
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                        isActive
                          ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/10 text-blue-300 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : ''}`} />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                
                {/* Info Tab */}
                {activeTab === "info" && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Traffic Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-6 bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          <ArrowDownToLine className="w-16 h-16 text-cyan-400" />
                        </div>
                        <p className="text-sm font-medium text-cyan-400/80 mb-2 flex items-center gap-2">
                          <ArrowDownToLine className="w-4 h-4" /> Total Download
                        </p>
                        <p className="text-4xl font-black text-white tracking-tight">{fmtBytes(data.total_download)}</p>
                      </div>
                      <div className="p-6 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          <ArrowUpFromLine className="w-16 h-16 text-emerald-400" />
                        </div>
                        <p className="text-sm font-medium text-emerald-400/80 mb-2 flex items-center gap-2">
                          <ArrowUpFromLine className="w-4 h-4" /> Total Upload
                        </p>
                        <p className="text-4xl font-black text-white tracking-tight">{fmtBytes(data.total_upload)}</p>
                      </div>
                    </div>

                    {/* Device Metadata */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                      <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <Server className="w-4 h-4 text-blue-400" /> Identity & Metadata
                      </h4>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                          <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mb-1.5">
                            <Cpu className="w-3.5 h-3.5" /> OS
                          </p>
                          <p className="text-slate-200 font-medium text-sm">{data.os_label || deviceData?.os_label || 'Unknown'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mb-1.5">
                            <Monitor className="w-3.5 h-3.5" /> Type
                          </p>
                          <p className="text-slate-200 font-medium text-sm">{data.device_type || deviceData?.device_type || 'Unknown'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mb-1.5">
                            <HardDrive className="w-3.5 h-3.5" /> Manufacturer
                          </p>
                          <p className="text-slate-200 font-medium text-sm">{data.manufacturer || deviceData?.manufacturer || 'Unknown'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mb-1.5">
                            <Clock className="w-3.5 h-3.5" /> Last Seen
                          </p>
                          <p className="text-slate-200 font-medium text-sm">{data.last_seen || deviceData?.last_seen ? new Date(data.last_seen || deviceData?.last_seen || '').toLocaleString() : 'Never'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Current Activity / Destinations */}
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
                      <h4 className="text-xs font-bold tracking-widest text-blue-400/80 uppercase flex items-center gap-2 mb-4">
                        <Globe className="w-4 h-4" /> Current Activity (Top Destinations)
                      </h4>
                      {(!data.destinations || data.destinations.length === 0) ? (
                        <p className="text-slate-400 text-sm italic">No active destination data available.</p>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {data.destinations.slice(0, 5).map((dst: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                  <Activity className="w-4 h-4 text-blue-400" />
                                </div>
                                <div>
                                  <p className="text-slate-200 font-mono text-sm">{dst.app_label}</p>
                                  <p className="text-slate-500 text-xs">Destination IP</p>
                                </div>
                              </div>
                              <div className="flex gap-4 text-right">
                                <div>
                                  <p className="text-cyan-400 text-xs font-medium">{fmtBytes(dst.download)}</p>
                                  <p className="text-slate-500 text-[10px] uppercase tracking-widest">Down</p>
                                </div>
                                <div>
                                  <p className="text-emerald-400 text-xs font-medium">{fmtBytes(dst.upload)}</p>
                                  <p className="text-slate-500 text-[10px] uppercase tracking-widest">Up</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Apps Tab */}
                {activeTab === "apps" && (
                  <div className="space-y-4 animate-fade-in">
                    {(!data.apps || data.apps.length === 0) ? (
                      <div className="text-center py-10 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <Box className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <h4 className="text-slate-300 font-bold text-lg mb-1">No Application Traffic</h4>
                        <p className="text-slate-400 font-medium max-w-md mx-auto">
                          No application-specific traffic has been classified for this IP yet, or data is currently being ingested from the network sensor.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.apps.map((app: any, i: number) => {
                          const totalBytes = data.total_download + data.total_upload;
                          const appBytes = app.download + app.upload;
                          const pct = totalBytes > 0 ? ((appBytes / totalBytes) * 100).toFixed(1) : "0";
                          return (
                            <div key={i} className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl hover:bg-white/[0.05] transition-colors group relative overflow-hidden">
                              <div className="absolute top-0 left-0 h-1 bg-blue-500/30 transition-all duration-500" style={{ width: `${pct}%` }} />
                              <h5 className="font-semibold text-white mb-3 text-lg flex justify-between items-center">
                                {app.app_label}
                                <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full ring-1 ring-blue-500/20">{pct}%</span>
                              </h5>
                              <div className="space-y-2">
                                <ActiveDurationDisplay firstSeen={app.first_seen} lastSeen={app.last_seen} />
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-500">Download</span>
                                  <span className="text-cyan-400 font-mono">{fmtBytes(app.download)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-500">Upload</span>
                                  <span className="text-emerald-400 font-mono">{fmtBytes(app.upload)}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Protocols Tab */}
                {activeTab === "protocols" && (
                  <div className="space-y-4 animate-fade-in">
                    {(!data.protocols || data.protocols.length === 0) ? (
                      <div className="text-center py-10 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <Link2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <h4 className="text-slate-300 font-bold text-lg mb-1">No Protocol Data</h4>
                        <p className="text-slate-400 font-medium max-w-md mx-auto">
                          No distinct protocols or ports have been classified for this IP yet.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.protocols.map((proto: any, i: number) => {
                          const totalBytes = data.total_download + data.total_upload;
                          const appBytes = proto.download + proto.upload;
                          const pct = totalBytes > 0 ? ((appBytes / totalBytes) * 100).toFixed(1) : "0";
                          return (
                            <div key={i} className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl hover:bg-white/[0.05] transition-colors group relative overflow-hidden">
                              <div className="absolute top-0 left-0 h-1 bg-amber-500/30 transition-all duration-500" style={{ width: `${pct}%` }} />
                              <h5 className="font-semibold text-white mb-3 text-lg flex justify-between items-center">
                                {formatProtocolLabel(proto.app_label)}
                                <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full ring-1 ring-amber-500/20">{pct}%</span>
                              </h5>
                              <div className="space-y-2">
                                <ActiveDurationDisplay firstSeen={proto.first_seen} lastSeen={proto.last_seen} />
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-500">Download</span>
                                  <span className="text-cyan-400 font-mono">{fmtBytes(proto.download)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-500">Upload</span>
                                  <span className="text-emerald-400 font-mono">{fmtBytes(proto.upload)}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Domains Tab */}
                {activeTab === "domains" && (
                  <div className="space-y-4 animate-fade-in">
                    {(!data.domains || data.domains.length === 0) ? (
                      <div className="text-center py-10 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <Globe className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <h4 className="text-slate-300 font-bold text-lg mb-1">No Web/Domain Traffic</h4>
                        <p className="text-slate-400 font-medium max-w-md mx-auto">
                          No distinct domain names have been extracted from SNI or DNS data for this IP yet.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.domains.map((dom: any, i: number) => {
                          const totalBytes = data.total_download + data.total_upload;
                          const appBytes = dom.download + dom.upload;
                          const pct = totalBytes > 0 ? ((appBytes / totalBytes) * 100).toFixed(1) : "0";
                          return (
                            <div key={i} className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl hover:bg-white/[0.05] transition-colors group relative overflow-hidden">
                              <div className="absolute top-0 left-0 h-1 bg-purple-500/30 transition-all duration-500" style={{ width: `${pct}%` }} />
                              <h5 className="font-semibold text-white mb-3 text-lg flex justify-between items-center truncate gap-2" title={dom.app_label}>
                                <span className="truncate">{dom.app_label}</span>
                                <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full ring-1 ring-purple-500/20 shrink-0">{pct}%</span>
                              </h5>
                              <div className="space-y-2">
                                <ActiveDurationDisplay firstSeen={dom.first_seen} lastSeen={dom.last_seen} />
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-500">Download</span>
                                  <span className="text-cyan-400 font-mono">{fmtBytes(dom.download)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-500">Upload</span>
                                  <span className="text-emerald-400 font-mono">{fmtBytes(dom.upload)}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Flows Tab */}
                {activeTab === "flows" && (
                  <div className="space-y-4 animate-fade-in">
                    {(!data.flows || data.flows.length === 0) ? (
                      <div className="text-center py-10 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <h4 className="text-slate-300 font-bold text-lg mb-1">No Flow Data Yet</h4>
                        <p className="text-slate-400 font-medium max-w-md mx-auto">
                          Network flows for this IP haven't been captured or are currently being ingested. If you just started the system, please wait a few moments as data is actively being synchronized.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden shadow-xl">
                        <div className="overflow-x-auto custom-scrollbar max-h-[60vh]">
                          <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="bg-slate-900/80 text-slate-300 sticky top-0 backdrop-blur-md border-b border-white/10 z-10">
                              <tr>
                                <th className="px-5 py-4 font-semibold">Time</th>
                                <th className="px-5 py-4 font-semibold">Source</th>
                                <th className="px-5 py-4 font-semibold">Destination</th>
                                <th className="px-5 py-4 font-semibold">Port</th>
                                <th className="px-5 py-4 font-semibold">App / Protocol</th>
                                <th className="px-5 py-4 font-semibold text-right">Download</th>
                                <th className="px-5 py-4 font-semibold text-right">Upload</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {data.flows.map((f: any, i: number) => {
                                const isOutbound = f.src_ip === ip;
                                return (
                                  <tr key={i} className="hover:bg-blue-500/5 transition-colors">
                                    <td className="px-5 py-3 text-slate-400 text-xs">{new Date(f.timestamp).toLocaleString()}</td>
                                    <td className="px-5 py-3">
                                      <span className={`font-mono ${isOutbound ? 'text-blue-300 font-semibold' : 'text-slate-400'}`}>{f.src_ip}</span>
                                    </td>
                                    <td className="px-5 py-3">
                                      <span className={`font-mono ${!isOutbound ? 'text-blue-300 font-semibold' : 'text-slate-400'}`}>{f.dst_ip}</span>
                                    </td>
                                    <td className="px-5 py-3 text-amber-200/80 font-mono text-xs">{f.dst_port || '-'}</td>
                                    <td className="px-5 py-3">
                                      <span className="bg-white/10 text-slate-200 px-2.5 py-1 rounded-md text-xs font-medium border border-white/5">
                                        {f.app_label || f.protocol || "-"}
                                      </span>
                                    </td>
                                    <td className="px-5 py-3 text-right text-cyan-400 font-mono text-xs">{fmtBytes(f.download)}</td>
                                    <td className="px-5 py-3 text-right text-emerald-400 font-mono text-xs">{fmtBytes(f.upload)}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Threats Tab */}
                {activeTab === "threats" && (
                  <div className="space-y-4 animate-fade-in">
                    {(!data.threats || data.threats.length === 0) ? (
                      <div className="text-center py-12 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                        <Shield className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
                        <h4 className="text-emerald-400 font-bold text-lg mb-1">No Threats Detected</h4>
                        <p className="text-emerald-300/70 text-sm max-w-md mx-auto">
                          This device's traffic appears secure. Keep in mind that new threat intelligence data may take a few moments to sync after a system restart.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                          <thead className="bg-slate-900/80 text-slate-300 sticky top-0 backdrop-blur-md border-b border-white/10 z-10">
                            <tr>
                              <th className="px-5 py-4 font-semibold">Time</th>
                              <th className="px-5 py-4 font-semibold">Type</th>
                              <th className="px-5 py-4 font-semibold">Severity</th>
                              <th className="px-5 py-4 font-semibold">Target IP</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {data.threats.map((t: any, i: number) => {
                              const sev = (t.severity || '').toLowerCase();
                              let badgeCls = "bg-slate-500/20 text-slate-300 ring-slate-500/30";
                              if (sev === 'high' || sev === 'critical') badgeCls = "bg-red-500/20 text-red-400 ring-red-500/30";
                              else if (sev === 'medium') badgeCls = "bg-amber-500/20 text-amber-400 ring-amber-500/30";
                              else if (sev === 'low') badgeCls = "bg-blue-500/20 text-blue-400 ring-blue-500/30";

                              return (
                                <tr key={i} className="hover:bg-red-500/5 transition-colors">
                                  <td className="px-5 py-3 text-slate-400 text-xs">{new Date(t.timestamp).toLocaleString()}</td>
                                  <td className="px-5 py-3 font-semibold text-slate-200">{t.threat_type || "-"}</td>
                                  <td className="px-5 py-3">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ring-1 ${badgeCls}`}>
                                      {t.severity || "-"}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3 font-mono text-slate-300">{t.dst_ip || "-"}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
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
