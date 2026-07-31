"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { fmtBytes } from "@/lib/utils";
import { getViewAsHeaders } from "@/lib/admin-api";
import { Loader2, Monitor, Shield, Tag, Cpu, Clock, Network, ArrowDownToLine } from "lucide-react";

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
  const [isExporting, setIsExporting] = useState(false);

  const exportToPdf = async () => {
    setIsExporting(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { default: DeviceMacPdfDocument } = await import("./DeviceMacPdfDocument");
      const reportDateStr = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " WIB";
      const doc = <DeviceMacPdfDocument macAddress={macAddress} customLabel={customLabel} defaultLabel={defaultLabel} agentName={agentName} manufacturer={manufacturer} deviceType={deviceType} ips={ips} reportDateStr={reportDateStr} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Device_MAC_Details_${macAddress.replace(/[:]/g, "")}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export PDF:", err);
      alert("Failed to generate PDF report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !macAddress) return;
    setIsLoading(true);
    setError(null);
    fetch(`/api/dashboard/devices/mac-details?mac=${encodeURIComponent(macAddress)}`, { headers: getViewAsHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setIps(data.ips || []);
        else setError(data.error || "Failed to load device details.");
      })
      .catch((err) => setError(err.message || "An error occurred while loading details."))
      .finally(() => setIsLoading(false));
  }, [isOpen, macAddress]);

  const DateCell = ({ dateStr }: { dateStr?: string }) => {
    if (!dateStr) return <span>-</span>;
    try {
      const d = new Date(dateStr);
      const datePart = d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
      const timePart = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
      return (
        <div className="flex flex-col items-center justify-center leading-tight py-0.5" title={`${datePart} ${timePart}`}>
          <span className="font-medium text-slate-300 text-[11px] whitespace-nowrap">{datePart}</span>
          <span className="text-[10px] text-slate-500 whitespace-nowrap">{timePart}</span>
        </div>
      );
    } catch { return <span>{dateStr}</span>; }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🔍 Device Network Details"
    >
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1 custom-scrollbar">
        {/* Profile Card */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Tag className="w-3 h-3" /> MAC Address
            </span>
            <code className="text-xs text-white font-mono block truncate" title={macAddress}>{macAddress}</code>
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
            <span className="text-xs text-slate-200 block capitalize truncate" title={deviceType}>{deviceType || "Unknown"}</span>
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
            <div className="border border-white/10 rounded-xl overflow-x-auto overflow-y-auto max-h-60 custom-scrollbar bg-[#090D16]">
              <table className="w-full text-xs text-slate-300 border-collapse table-fixed min-w-[520px]">
                <thead className="bg-[#0F172A] text-slate-300 uppercase text-[9px] tracking-wider border-b border-white/10 sticky top-0 z-10">
                  <tr className="bg-[#0F172A]">
                    <th className="px-2.5 py-2.5 text-center w-[25%]">IP Address</th>
                    <th className="px-2 py-2.5 text-center w-[20%]">First Seen</th>
                    <th className="px-2 py-2.5 text-center w-[20%]">Last Seen</th>
                    <th className="px-2 py-2.5 text-center w-[23%]">Traffic (Down / Up)</th>
                    <th className="px-2 py-2.5 text-center w-[12%]">Flows</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {ips.map((ip) => (
                    <tr key={ip.ip_address} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-2.5 py-2.5 font-mono text-center text-slate-200">
                        <div className="truncate w-full text-center font-semibold text-cyan-300 text-xs" title={ip.ip_address}>
                          {ip.ip_address}
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-center text-slate-400">
                        <DateCell dateStr={ip.first_seen} />
                      </td>
                      <td className="px-2 py-2.5 text-center text-slate-400">
                        <DateCell dateStr={ip.last_seen} />
                      </td>
                      <td className="px-2 py-2.5 text-center font-mono text-[11px] whitespace-nowrap">
                        <span className="text-cyan-400 font-semibold">{fmtBytes(ip.download)}</span>
                        <span className="text-slate-600 mx-1">/</span>
                        <span className="text-emerald-400 font-semibold">{fmtBytes(ip.upload)}</span>
                      </td>
                      <td className="px-2 py-2.5 text-center font-mono text-cyan-400 font-semibold text-xs">
                        {ip.flows?.toLocaleString() ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <button
            type="button"
            disabled={isExporting || isLoading}
            onClick={exportToPdf}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowDownToLine className="w-3.5 h-3.5" />}
            <span>{isExporting ? "Generating..." : "Export PDF"}</span>
          </button>
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
