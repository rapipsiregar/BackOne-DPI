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
import DeviceIdentityCard from "./DeviceIdentityCard";
import DeviceKpiSection from "./DeviceKpiSection";

interface Props {
  ip: string;
  mac?: string;
  deviceData?: DeviceStat;
  onClose: () => void;
}

type Tab = "info" | "apps" | "protocols" | "domains" | "flows" | "threats";

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: "info", label: "Overview", icon: Monitor },
  { id: "apps", label: "Applications", icon: Box },
  { id: "protocols", label: "Protocols", icon: Link2 },
  { id: "domains", label: "Domains / Web", icon: Globe },
  { id: "flows", label: "Network Flows", icon: Activity },
  { id: "threats", label: "Threats", icon: Shield }
];

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

  const [isExporting, setIsExporting] = useState(false);

  const exportToPdf = async () => {
    if (!data) return;
    setIsExporting(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { default: DevicePdfDocument } = await import("./DevicePdfDocument");
      const reportDateStr = new Date().toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta", day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      }) + " WIB";

      const doc = <DevicePdfDocument data={data} ip={ip || data.ip_address || ""} mac={mac || data.mac_address || ""} deviceData={deviceData} reportDateStr={reportDateStr} />;

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Device_DPI_Telemetry_Report_${ip || data.ip_address || "device"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export PDF:", err);
      alert("Failed to generate PDF report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className={`absolute inset-0 bg-black/60 backdrop-blur-md ${isClosing ? 'animate-overlay-out' : 'animate-overlay-in'}`} />
      <div
        className={`relative bg-card border border-border/50 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl shadow-black/10 dark:shadow-blue-900/20 overflow-hidden backdrop-blur-xl font-sans ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4 py-4 sm:px-6 sm:py-5 border-b border-border bg-gradient-to-br from-blue-500/5 via-slate-500/5 to-slate-500/10 dark:from-blue-900/10 dark:via-slate-900/20 dark:to-slate-950/40 relative z-10">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full" />
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-lg sm:rounded-xl ring-1 ring-blue-500/30 relative">
                <Monitor className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 dark:text-blue-400" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h3 className="text-base sm:text-xl font-bold text-card-foreground tracking-tight truncate max-w-full">
                  {ip || data?.ip_address || 'Resolving IP...'}
                </h3>
                {isRefreshing && <RefreshCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500 dark:text-blue-400 animate-spin flex-shrink-0" />}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1 sm:gap-2">
                <span className="truncate max-w-[150px] sm:max-w-none">{data?.device_label || deviceData?.device_label || 'Unknown Device'}</span> 
                <span className="hidden sm:inline text-border">•</span> 
                <span className="font-mono text-[10px] sm:text-xs bg-muted/60 dark:bg-slate-800/80 px-1.5 py-0.5 rounded leading-none">{mac || data?.mac_address || deviceData?.mac_address || 'No MAC'}</span>
              </p>
              {data?.agent_label && (
                <p className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 mt-1 flex flex-wrap items-center gap-1">
                  <Server className="w-3 h-3 flex-shrink-0" />
                  <span>Source Agent:</span>
                  <strong className="bg-blue-500/10 px-1 py-0.5 rounded">{data.agent_label}</strong>
                  <span className="text-muted-foreground/60 truncate max-w-[100px] sm:max-w-none">({data.agent_uuid})</span>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 w-full sm:w-auto border-t border-border/40 pt-3 sm:border-t-0 sm:pt-0">
            {data ? (
              <button
                disabled={isExporting}
                onClick={exportToPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/15 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                ) : (
                  <ArrowDownToLine className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                )}
                Export PDF
              </button>
            ) : <div />}
            <button onClick={handleClose} className="p-1.5 sm:p-2 text-muted-foreground hover:text-card-foreground hover:bg-secondary rounded-lg sm:rounded-xl transition-all">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
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
              <div className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 border-b border-border overflow-x-auto flex-nowrap bg-secondary/30 flex-shrink-0 no-scrollbar select-none">
                {tabs.map((t) => {
                  const Icon = t.icon;
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`flex items-center gap-1.5 sm:gap-2.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex-shrink-0 ${
                        isActive
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/30"
                          : "text-muted-foreground hover:text-card-foreground hover:bg-secondary border border-transparent"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {activeTab === "info" && (
                  <div className="space-y-6 animate-fade-in text-xs">
                    <ActiveDurationDisplay firstSeen={data.first_seen || undefined} lastSeen={data.last_seen || undefined} />
                    
                    <DeviceKpiSection totalDownload={data.total_download} totalUpload={data.total_upload} />

                    <DeviceIdentityCard
                      osLabel={data.os_label || deviceData?.os_label || ""}
                      deviceType={data.device_type || deviceData?.device_type || ""}
                      manufacturer={data.manufacturer || deviceData?.manufacturer || ""}
                      lastSeen={data.last_seen || deviceData?.last_seen || ""}
                    />
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
