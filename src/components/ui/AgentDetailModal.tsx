"use client";

import { useState, useEffect } from "react";
import { fetchAgentDetails, AgentDetails } from "@/lib/api";
import { fmtBytes, getAppFavicon } from "@/lib/utils";
import { DeviceDetailModal } from "@/components/ui/DeviceDetailModal";
import { AppDetailModal } from "@/components/ui/AppDetailModal";
import {
  Loader2, X, Server, Monitor, Activity, Globe, Shield,
  Bell, Wifi, ChevronRight, LineChart
} from "lucide-react";

import AgentDevicesTab from "./AgentDevicesTab";
import AgentFlowsTab from "./AgentFlowsTab";
import AgentSecurityTab from "./AgentSecurityTab";
import AgentEventsTab from "./AgentEventsTab";
import AgentMacTab from "./AgentMacTab";
import AgentTelemetryTab from "./AgentTelemetryTab";

interface Props {
  agentUuid: string;
  agentLabel: string;
  onClose: () => void;
}

type Tab = "devices" | "flows" | "apps" | "security" | "events" | "mac" | "telemetry";

function EmptyState({ msg }: { msg: string }) {
  return <p className="text-muted-foreground text-sm text-center py-10">{msg}</p>;
}

export function AgentDetailModal({ agentUuid, agentLabel, onClose }: Props) {
  const [data,      setData]      = useState<AgentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("devices");
  const [selectedDevice, setSelectedDevice] = useState<{ ip: string; label: string | null; mac: string | null; agent_uuid?: string } | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedAppLabel, setSelectedAppLabel] = useState<string | null>(null);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 480);
  };

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchAgentDetails(agentUuid)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [agentUuid]);

  // Reset tab scroll/state when switching tabs
  useEffect(() => {
    const el = document.querySelector(".custom-scrollbar");
    if (el) el.scrollTop = 0;
  }, [activeTab]);

  const secCount = data
    ? (data.security?.insecure_protocols?.length ?? 0) +
      (data.security?.unencrypted_passwords?.length ?? 0) +
      (data.security?.tor_detections?.length ?? 0) +
      (data.security?.vpn_detections?.length ?? 0)
    : 0;

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "devices",   label: "Devices",      icon: <Monitor className="w-3.5 h-3.5" />,       count: data?.devices?.length },
    { key: "flows",     label: "Flows",         icon: <Activity className="w-3.5 h-3.5" />,      count: data?.flows?.length },
    { key: "apps",      label: "Top Apps",      icon: <Globe className="w-3.5 h-3.5" />,         count: data?.top_apps?.length },
    { key: "security",  label: "Security",      icon: <Shield className="w-3.5 h-3.5" />,        count: secCount || undefined },
    { key: "events",    label: "Events",        icon: <Bell className="w-3.5 h-3.5" />,          count: data?.events?.length },
    { key: "mac",       label: "MAC Bandwidth", icon: <Wifi className="w-3.5 h-3.5" />,          count: data?.mac_bandwidth?.length },
    { key: "telemetry", label: "Telemetry",     icon: <LineChart className="w-3.5 h-3.5" /> },
  ];

  return (
    <>
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={handleClose}>
      <div className={`absolute inset-0 bg-black/40 dark:bg-black/75 backdrop-blur-sm ${isClosing ? 'animate-overlay-out' : 'animate-overlay-in'}`} />
      <div
        className={`relative bg-card border border-border/50 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl shadow-black/60 font-sans ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-4 sm:px-6 sm:py-4 border-b border-border bg-gradient-to-r from-blue-900/30 to-purple-900/20 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg ring-1 ring-blue-500/30 flex-shrink-0">
              <Server className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-bold text-card-foreground truncate">{agentLabel}</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-mono truncate">{agentUuid}</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 sm:p-2 text-muted-foreground hover:text-card-foreground hover:bg-secondary rounded-lg transition-all self-end sm:self-auto">
            <X className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              <p className="text-muted-foreground text-sm">Loading agent data...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-400 text-sm">{error}</div>
          ) : data ? (
            <>
              {/* KPI row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 py-3 sm:px-6 sm:py-4 border-b border-border/50 flex-shrink-0">
                {[
                  { label: "Devices",    value: data.summary?.total_devices || data.devices.length, color: "text-card-foreground" },
                  { label: "Flows",      value: data.summary?.active_flows || data.flows.length, color: "text-card-foreground" },
                  { label: "Download",   value: fmtBytes(data.summary?.bandwidth_down || data.devices.reduce((acc, d) => acc + (d.download ?? 0), 0)), color: "text-cyan-400" },
                  { label: "Upload",     value: fmtBytes(data.summary?.bandwidth_up || data.devices.reduce((acc, d) => acc + (d.upload ?? 0), 0)), color: "text-green-400" },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-secondary rounded-xl p-2.5 sm:p-3 border border-border/50">
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">{kpi.label}</p>
                    <p className={`text-base sm:text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div className="flex gap-1.5 px-4 sm:px-6 py-2 sm:py-3 border-b border-border/50 flex-shrink-0 overflow-x-auto flex-nowrap no-scrollbar select-none">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
                      activeTab === tab.key
                        ? "bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/40"
                        : "text-muted-foreground hover:text-card-foreground hover:bg-secondary"
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`ml-0.5 px-1.5 py-0.5 rounded text-[10px] ${activeTab === tab.key ? "bg-blue-500/30 text-blue-200" : "bg-white/10 text-slate-300"}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="px-6 py-4 space-y-4">
                {activeTab === "devices" && (
                  <AgentDevicesTab
                    devices={data.devices}
                    onSelectDevice={(d) => setSelectedDevice({ ip: d.ip, label: d.label, mac: d.mac, agent_uuid: agentUuid })}
                  />
                )}

                {activeTab === "flows" && (
                  <AgentFlowsTab flows={data.flows} />
                )}

                {activeTab === "apps" && (
                  data.top_apps.length === 0 ? <EmptyState msg="No applications accessed by this agent." /> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {data.top_apps.map((app) => {
                        const appTotal = app.download + app.upload;
                        return (
                          <button
                            key={app.app_id}
                            onClick={() => setSelectedAppLabel(app.app_label)}
                            className="flex items-center gap-3 p-3 bg-white/[0.03] hover:bg-white/[0.07] border border-border/50 rounded-xl transition-all group w-full text-left"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-card-foreground text-sm truncate group-hover:text-cyan-300 transition-colors">{app.app_label}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{app.category || "Web"}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs text-card-foreground font-semibold">{fmtBytes(appTotal)}</p>
                              <span className="text-[10px] text-muted-foreground flex gap-2">
                                <span className="text-cyan-400">DL: {fmtBytes(app.download)}</span>
                                <span className="text-green-400">UL: {fmtBytes(app.upload)}</span>
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                          </button>
                        );
                      })}
                    </div>
                  )
                )}

                {activeTab === "security" && (
                  <AgentSecurityTab data={data} />
                )}

                {activeTab === "events" && (
                  <AgentEventsTab events={data.events} />
                )}

                {activeTab === "mac" && (
                  <AgentMacTab macBandwidth={data.mac_bandwidth} />
                )}

                {activeTab === "telemetry" && (
                  <AgentTelemetryTab agentUuid={agentUuid} />
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
        mac={selectedDevice.mac || ''}
        deviceData={{ agent_uuid: selectedDevice.agent_uuid || agentUuid } as any}
        onClose={() => setSelectedDevice(null)}
      />
    )}
    {selectedAppLabel && (
      <AppDetailModal
        appLabel={selectedAppLabel}
        favicon={getAppFavicon(selectedAppLabel)}
        agentUuid={agentUuid}
        onClose={() => setSelectedAppLabel(null)}
      />
    )}
    </>
  );
}
