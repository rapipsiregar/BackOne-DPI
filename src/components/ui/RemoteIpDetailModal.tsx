"use client";

import { useState, useEffect } from "react";
import { fetchRemoteIpDetails } from "@/lib/api";
import { RemoteIpDetails } from "@/lib/api-detail-types";
import { fmtBytes } from "@/lib/utils";
import { Loader2, X, Globe, Activity, Shield, Box, Server, Clock, ArrowDownToLine, ArrowUpFromLine, RefreshCcw, Link2, Laptop } from "lucide-react";
import ActiveDurationDisplay from "./ActiveDurationDisplay";
import { IpDetails } from "./IpDetails";

import RemoteIpLocalDevicesTab from "./RemoteIpLocalDevicesTab";
import DeviceProtocolsTab from "./DeviceProtocolsTab";
import DeviceDomainsTab from "./DeviceDomainsTab";
import DeviceFlowsTab from "./DeviceFlowsTab";
import DeviceThreatsTab from "./DeviceThreatsTab";

interface Props {
  ip: string;
  onClose: () => void;
}

type Tab = "info" | "local_devices" | "protocols" | "domains" | "flows" | "threats";

export function RemoteIpDetailModal({ ip, onClose }: Props) {
  const [data, setData] = useState<RemoteIpDetails | null>(null);
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
      const res = await fetchRemoteIpDetails(ip, '1d');
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
  }, [ip]);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "info", label: "Overview", icon: Globe },
    { id: "local_devices", label: "Local Devices", icon: Laptop },
    { id: "protocols", label: "Protocols", icon: Link2 },
    { id: "domains", label: "Domains", icon: Box },
    { id: "flows", label: "Flows", icon: Activity },
    { id: "threats", label: "Threats", icon: Shield }
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={handleClose}>
      <div className={`absolute inset-0 bg-black/60 backdrop-blur-md ${isClosing ? 'animate-overlay-out' : 'animate-overlay-in'}`} />
      <div
        className={`relative bg-card border border-border rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl shadow-black/10 dark:shadow-blue-900/20 overflow-hidden backdrop-blur-xl ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-gradient-to-br from-indigo-500/5 via-slate-500/5 to-slate-500/10 dark:from-indigo-900/10 dark:via-slate-900/20 dark:to-slate-950/40 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full" />
              <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-blue-500/10 rounded-xl ring-1 ring-indigo-500/30 relative">
                <Globe className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-card-foreground tracking-tight">{ip}</h3>
                {isRefreshing && <RefreshCcw className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 animate-spin" />}
              </div>
              <div className="mt-1">
                <IpDetails ip={ip} />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => loadData(true)} 
              disabled={isLoading || isRefreshing}
              className="p-2.5 text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 rounded-full transition-all disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
            <button 
              onClick={handleClose}
              className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-all bg-black/5 dark:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex px-6 border-b border-border bg-muted/20 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-4 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5' 
                  : 'border-transparent text-muted-foreground hover:text-card-foreground hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? '' : 'opacity-70'}`} />
              {tab.label}
              {data && tab.id === 'flows' && data.flows.length > 0 && (
                <span className="ml-1.5 px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] text-muted-foreground font-semibold">
                  {data.flows.length}
                </span>
              )}
              {data && tab.id === 'threats' && data.threats.length > 0 && (
                <span className="ml-1.5 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-semibold ring-1 ring-destructive/20">
                  {data.threats.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-transparent to-muted/10 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 animate-in fade-in duration-500">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-sm font-medium text-muted-foreground">Loading remote IP intelligence...</p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-destructive">
              <Shield className="w-10 h-10 mb-2 opacity-50" />
              <p className="font-semibold text-lg">Error loading data</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          ) : data ? (
            <div className="h-full animate-in fade-in slide-in-from-bottom-2 duration-500">
              {activeTab === "info" && (
                <div className="space-y-6">
                  <ActiveDurationDisplay firstSeen={data.first_seen || undefined} lastSeen={data.last_seen || undefined} />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-gradient-to-br from-cyan-500/5 dark:from-cyan-500/10 to-transparent border border-cyan-100 dark:border-cyan-500/20 rounded-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ArrowDownToLine className="w-16 h-16 text-cyan-500 dark:text-cyan-400" />
                      </div>
                      <p className="text-sm font-medium text-cyan-600 dark:text-cyan-400/80 mb-2 flex items-center gap-2">
                        <ArrowDownToLine className="w-4 h-4" /> Total Download (to Remote IP)
                      </p>
                      <p className="text-4xl font-black text-card-foreground tracking-tight">{fmtBytes(data.total_download)}</p>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-emerald-500/5 dark:from-emerald-500/10 to-transparent border border-emerald-100 dark:border-emerald-500/20 rounded-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ArrowUpFromLine className="w-16 h-16 text-emerald-500 dark:text-emerald-400" />
                      </div>
                      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400/80 mb-2 flex items-center gap-2">
                        <ArrowUpFromLine className="w-4 h-4" /> Total Upload (from Remote IP)
                      </p>
                      <p className="text-4xl font-black text-card-foreground tracking-tight">{fmtBytes(data.total_upload)}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50/50 dark:bg-white/[0.02] border border-border rounded-2xl p-6">
                    <h4 className="text-sm font-bold text-card-foreground uppercase tracking-wider mb-6 flex items-center gap-2">
                      <Server className="w-4 h-4 text-indigo-500" /> Network Properties
                    </h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5"><Globe className="w-3.5 h-3.5" /> IP Version</p>
                        <p className="text-card-foreground font-medium text-sm">IPv{data.ip_version}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5"><Laptop className="w-3.5 h-3.5" /> Interacting Devices</p>
                        <p className="text-card-foreground font-medium text-sm">{data.local_devices?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5"><Link2 className="w-3.5 h-3.5" /> Flow Count</p>
                        <p className="text-card-foreground font-medium text-sm">{data.flows?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5"><Clock className="w-3.5 h-3.5" /> Last Seen</p>
                        <p className="text-card-foreground font-medium text-sm">{data.last_seen ? new Date(data.last_seen).toLocaleString() : 'Never'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "local_devices" && (
                <RemoteIpLocalDevicesTab devices={data.local_devices} totalDownload={data.total_download} totalUpload={data.total_upload} />
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
          ) : null}
        </div>
      </div>
    </div>
  );
}
