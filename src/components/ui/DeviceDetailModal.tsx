"use client";

import { useState, useEffect } from "react";
import { fetchDeviceDetails, DeviceDetails, DeviceStat } from "@/lib/api";
import { fmtBytes } from "@/lib/utils";
import { Loader2, X, Monitor, Activity, Shield, Box, Server, Cpu, Clock, HardDrive, ArrowDownToLine, ArrowUpFromLine, RefreshCcw, Globe, Link2 } from "lucide-react";
import ActiveDurationDisplay from "./ActiveDurationDisplay";

import DeviceAppsTab from "./DeviceAppsTab";
import DeviceProtocolsTab from "./DeviceProtocolsTab";
import DeviceDomainsTab from "./DeviceDomainsTab";
import DeviceFlowsTab from "./DeviceFlowsTab";
import DeviceThreatsTab from "./DeviceThreatsTab";

interface Props {
  ip: string;
  mac?: string;
  deviceData?: DeviceStat;
  onClose: () => void;
}

type Tab = "info" | "apps" | "protocols" | "domains" | "flows" | "threats";

export function DeviceDetailModal({ ip, mac = '', deviceData, onClose }: Props) {
  const [data, setData] = useState<DeviceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("info");

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 480);
  };

  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);
    try {
      const agentUuid = deviceData?.agent_uuid || '';
      const res = await fetchDeviceDetails(ip, '1d', mac, agentUuid);
      setData(res);
    } catch (e: any) {
      if (!silent) setError(e.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, [ip, mac]);

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
        className={`relative bg-card border border-border rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl shadow-black/10 dark:shadow-blue-900/20 overflow-hidden backdrop-blur-xl ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-gradient-to-br from-blue-500/5 via-slate-500/5 to-slate-500/10 dark:from-blue-900/10 dark:via-slate-900/20 dark:to-slate-950/40 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full" />
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-xl ring-1 ring-blue-500/30 relative">
                <Monitor className="w-6 h-6 text-blue-500 dark:text-blue-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-card-foreground tracking-tight">
                  {ip || data?.ip_address || 'Resolving IP...'}
                </h3>
                {isRefreshing && <RefreshCcw className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 animate-spin" />}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {data?.device_label || deviceData?.device_label || 'Unknown Device'} 
                <span className="text-border mx-2">•</span> 
                <span className="font-mono text-xs">{mac || data?.mac_address || deviceData?.mac_address || 'No MAC'}</span>
              </p>
              {data?.agent_label && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                  <Server className="w-3.5 h-3.5" />
                  Source Agent: <strong>{data.agent_label}</strong> <span className="text-muted-foreground/60">({data.agent_uuid})</span>
                </p>
              )}
            </div>
          </div>
          <button onClick={handleClose} className="p-2.5 text-muted-foreground hover:text-card-foreground hover:bg-secondary rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 min-h-0 bg-gradient-to-b from-transparent to-muted/20 relative z-10">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              <p className="text-muted-foreground font-medium">Gathering device telemetry...</p>
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
              <div className="flex items-center gap-2 px-6 py-3 border-b border-border overflow-x-hidden custom-scrollbar flex-shrink-0 bg-secondary/30 flex-wrap">
                {tabs.map((t) => {
                  const Icon = t.icon;
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                        isActive
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/30"
                          : "text-muted-foreground hover:text-card-foreground hover:bg-secondary border border-transparent"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {activeTab === "info" && (
                  <div className="space-y-6 animate-fade-in text-xs">
                    <ActiveDurationDisplay firstSeen={data.first_seen || undefined} lastSeen={data.last_seen || undefined} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-6 bg-gradient-to-br from-cyan-500/5 dark:from-cyan-500/10 to-transparent border border-cyan-100 dark:border-cyan-500/20 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          <ArrowDownToLine className="w-16 h-16 text-cyan-500 dark:text-cyan-400" />
                        </div>
                        <p className="text-sm font-medium text-cyan-600 dark:text-cyan-400/80 mb-2 flex items-center gap-2">
                          <ArrowDownToLine className="w-4 h-4" /> Total Download
                        </p>
                        <p className="text-4xl font-black text-card-foreground tracking-tight">{fmtBytes(data.total_download)}</p>
                      </div>
                      <div className="p-6 bg-gradient-to-br from-emerald-500/5 dark:from-emerald-500/10 to-transparent border border-emerald-100 dark:border-emerald-500/20 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          <ArrowUpFromLine className="w-16 h-16 text-emerald-500 dark:text-emerald-400" />
                        </div>
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400/80 mb-2 flex items-center gap-2">
                          <ArrowUpFromLine className="w-4 h-4" /> Total Upload
                        </p>
                        <p className="text-4xl font-black text-card-foreground tracking-tight">{fmtBytes(data.total_upload)}</p>
                      </div>
                    </div>

                    <div className="bg-slate-50/50 dark:bg-white/[0.02] border border-border rounded-2xl p-6">
                      <h4 className="text-sm font-bold text-card-foreground uppercase tracking-wider mb-6 flex items-center gap-2">
                        <Server className="w-4 h-4 text-blue-500" /> Identity & Metadata
                      </h4>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5"><Cpu className="w-3.5 h-3.5" /> OS</p>
                          <p className="text-card-foreground font-medium text-sm">{data.os_label || deviceData?.os_label || 'Unknown'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5"><Monitor className="w-3.5 h-3.5" /> Type</p>
                          <p className="text-card-foreground font-medium text-sm">{data.device_type || deviceData?.device_type || 'Unknown'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5"><HardDrive className="w-3.5 h-3.5" /> Manufacturer</p>
                          <p className="text-card-foreground font-medium text-sm">{data.manufacturer || deviceData?.manufacturer || 'Unknown'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5"><Clock className="w-3.5 h-3.5" /> Last Seen</p>
                          <p className="text-card-foreground font-medium text-sm">{data.last_seen || deviceData?.last_seen ? new Date(data.last_seen || deviceData?.last_seen || '').toLocaleString() : 'Never'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "apps" && (
                  <DeviceAppsTab apps={data.apps} totalDownload={data.total_download} totalUpload={data.total_upload} />
                )}

                {activeTab === "protocols" && (
                  <DeviceProtocolsTab protocols={data.protocols} totalDownload={data.total_download} totalUpload={data.total_upload} />
                )}

                {activeTab === "domains" && (
                  <DeviceDomainsTab domains={data.domains} totalDownload={data.total_download} totalUpload={data.total_upload} />
                )}

                {activeTab === "flows" && (
                  <DeviceFlowsTab flows={data.flows} ip={ip} />
                )}

                {activeTab === "threats" && (
                  <DeviceThreatsTab threats={data.threats} />
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
