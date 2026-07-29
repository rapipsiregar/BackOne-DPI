"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { fmtBytes } from "@/lib/utils";
import { getViewAsHeaders } from "@/lib/admin-api";
import { Loader2, Monitor, Shield, Tag, Cpu, Clock, Network } from "lucide-react";

interface IpHistoryItem {
  ip_address: string;
  first_seen: string;
  last_seen: string;
  download: number;
  upload: number;
  flows: number;
}

interface DeviceMacDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  macAddress: string;
  customLabel: string | null;
  defaultLabel: string;
  agentName: string;
  manufacturer: string;
  deviceType: string;
}

export default function DeviceMacDetailsModal({
  isOpen,
  onClose,
  macAddress,
  customLabel,
  defaultLabel,
  agentName,
  manufacturer,
  deviceType,
}: DeviceMacDetailsModalProps) {
  const [ips, setIps] = useState<IpHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !macAddress) return;

    setIsLoading(true);
    setError(null);

    fetch(`/api/dashboard/devices/mac-details?mac=${encodeURIComponent(macAddress)}`, {
      headers: getViewAsHeaders(),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setIps(data.ips || []);
        } else {
          setError(data.error || "Failed to load device details.");
        }
      })
      .catch((err) => {
        setError(err.message || "An error occurred while loading details.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, macAddress]);

  const formatFriendlyDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB";
    } catch {
      return dateStr;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🔍 Device Network Details"
    >
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1 custom-scrollbar">
        {/* Profile Card */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Tag className="w-3 h-3" /> MAC Address
            </span>
            <code className="text-xs text-white font-mono block">{macAddress}</code>
          </div>

          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Cpu className="w-3 h-3" /> Manufacturer
            </span>
            <span className="text-xs text-slate-200 block truncate" title={manufacturer}>
              {manufacturer || "Unknown"}
            </span>
          </div>

          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1 col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Monitor className="w-3 h-3" /> Device Labels
            </span>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-medium">Custom:</span>
                {customLabel ? (
                  <span className="text-xs font-semibold text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded-full">
                    {customLabel}
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 italic">No label configured</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-medium">System:</span>
                <span className="text-xs text-slate-400 truncate">{defaultLabel}</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Device Type
            </span>
            <span className="text-xs text-slate-200 block capitalize">{deviceType || "Unknown"}</span>
          </div>

          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Network className="w-3 h-3" /> Network Agent
            </span>
            <span className="text-xs text-purple-400 font-semibold block truncate" title={agentName}>
              {agentName}
            </span>
          </div>
        </div>

        {/* IPs Section */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            🔗 Associated IP Addresses
          </h4>

          {isLoading ? (
            <div className="py-8 flex justify-center items-center gap-2 text-slate-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              Resolving active IP address histories...
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs">
              ⚠️ {error}
            </div>
          ) : ips.length === 0 ? (
            <div className="py-8 text-center text-slate-500 italic text-xs border border-white/5 rounded-xl bg-white/[0.01]">
              No IP addresses recorded for this MAC address.
            </div>
          ) : (
            <div className="border border-white/5 rounded-xl overflow-hidden bg-white/[0.01]">
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                <table className="w-full text-xs text-slate-300">
                  <thead className="bg-white/[0.03] text-slate-400 uppercase text-[9px] tracking-wider sticky top-0 z-10 border-b border-white/5">
                    <tr>
                      <th className="px-3 py-2 text-center">IP Address</th>
                      <th className="px-3 py-2 text-center">First Seen</th>
                      <th className="px-3 py-2 text-center">Last Seen</th>
                      <th className="px-3 py-2 text-center">Traffic (Down / Up)</th>
                      <th className="px-3 py-2 text-center">Flows</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {ips.map((ip) => (
                      <tr key={ip.ip_address} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-3 py-2.5 font-mono text-center text-slate-200">
                          {ip.ip_address}
                        </td>
                        <td className="px-3 py-2.5 text-center text-slate-400">
                          {formatFriendlyDate(ip.first_seen)}
                        </td>
                        <td className="px-3 py-2.5 text-center text-slate-400 flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {formatFriendlyDate(ip.last_seen)}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono">
                          {fmtBytes(ip.download)} / {fmtBytes(ip.upload)}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-slate-400">
                          {ip.flows}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-all"
          >
            Close Details
          </button>
        </div>
      </div>
    </Modal>
  );
}
