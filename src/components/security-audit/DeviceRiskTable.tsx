// src/components/security-audit/DeviceRiskTable.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { SecurityDevice } from "@/lib/api";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DeviceDetailModal } from "@/components/ui/DeviceDetailModal";
import { ShieldCheck, ShieldAlert, Loader2, Info, ChevronDown } from "lucide-react";
import { fmtBytes } from "@/lib/utils";
import { TimestampCell } from "@/components/ui/TimestampCell";

const RISK_CONFIG: Record<string, any> = {
  Vulnerable: { color: "text-red-400", bg: "bg-red-500/20 ring-red-500/40", icon: <ShieldAlert className="w-3.5 h-3.5" />, dot: "bg-red-500" },
  Moderate: { color: "text-orange-400", bg: "bg-orange-500/20 ring-orange-500/40", icon: <ShieldAlert className="w-3.5 h-3.5" />, dot: "bg-orange-500" },
  Safe: { color: "text-green-400", bg: "bg-green-500/20 ring-green-500/40", icon: <ShieldCheck className="w-3.5 h-3.5" />, dot: "bg-green-500" },
} as const;

const FilterSelect = ({ value, onChange, options, placeholder }: { value: string; onChange: (val: string) => void; options: string[]; placeholder: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = value !== "All";

  return (
    <div className="relative w-full max-w-[140px] mx-auto flex justify-center" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center gap-1.5 w-full py-1 font-medium text-sm transition-colors outline-none ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-white'}`}
      >
        <span className="truncate max-w-[110px]">{placeholder}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-500 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <div 
        className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[200px] max-h-[300px] overflow-y-auto bg-slate-900 border border-border/50 rounded-lg shadow-xl z-50 flex flex-col py-1 transition-all duration-500 ease-in-out origin-top ${isOpen ? "opacity-100 scale-y-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-y-90 -translate-y-2 pointer-events-none"}`}
      >
        <button
          onClick={() => { onChange("All"); setIsOpen(false); }}
          className={`px-3 py-2 text-sm text-left transition-colors w-full ${value === "All" ? "bg-primary/20 text-white font-medium" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
        >
          All Risks
        </button>
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => { onChange(opt); setIsOpen(false); }}
            className={`px-3 py-2 text-sm text-left transition-colors w-full ${value === opt ? "bg-primary/20 text-white font-medium" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

interface Props {
  secDevices: SecurityDevice[];
  secDevicesLoading: boolean;
}

export default function DeviceRiskTable({ secDevices, secDevicesLoading }: Props) {
  const [selectedDevice, setSelectedDevice] = useState<SecurityDevice | null>(null);
  const [filterRisk, setFilterRisk] = useState<string>("All");

  const secDeviceColumns: Column<SecurityDevice>[] = [
    {
      header: "Timestamp",
      className: "w-[150px] min-w-[150px] max-w-[150px] text-center",
      accessor: (row) => <TimestampCell timestamp={row.timestamp} showActiveStatus={false} />
    },
    { header: "#", accessor: (_, i) => i + 1, className: "w-[60px] min-w-[60px] max-w-[60px]" },
    {
      header: "IP Address",
      accessor: (row) => (
        <button
          onClick={() => setSelectedDevice(row)}
          className="font-mono text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center gap-1 group mx-auto text-center"
        >
          {row.ip_address}
        </button>
      ),
      className: "w-[140px] min-w-[140px] max-w-[140px]"
    },
    {
      header: "Device",
      accessor: (row) => {
        const title = `${row.device_label || row.ip_address} (${row.device_type || 'Unknown'})`;
        return (
          <div title={title} className="flex flex-col items-center cursor-help w-full truncate text-center">
            <span className="text-sm text-white truncate max-w-full">{row.device_label || row.ip_address}</span>
            {row.device_type && <span className="text-xs text-slate-400 truncate max-w-full">{row.device_type}</span>}
          </div>
        );
      },
      className: "w-[180px] min-w-[180px] max-w-[180px]"
    },
    {
      header: "OS / Manufacturer",
      accessor: (row) => {
        const title = `${row.os_label || '-'} / ${row.manufacturer || ''}`;
        return (
          <div title={title} className="flex flex-col items-center cursor-help w-full truncate text-center">
            <span className="text-xs text-blue-400 truncate max-w-full">{row.os_label || "-"}</span>
            <span className="text-xs text-slate-500 truncate max-w-full">{row.manufacturer || ""}</span>
          </div>
        );
      },
      className: "w-[180px] min-w-[180px] max-w-[180px]"
    },
    {
      header: "Encrypted %",
      accessor: (row) => {
        const pct = row.encrypted_pct ?? 0;
        const color = pct >= 80 ? "text-green-400" : pct >= 50 ? "text-orange-400" : "text-red-400";
        const bar = pct >= 80 ? "from-green-500 to-emerald-400" : pct >= 50 ? "from-orange-500 to-yellow-400" : "from-red-500 to-pink-400";
        return (
          <div className="flex flex-col items-center gap-1 w-full text-center">
            <span className={`text-sm font-semibold ${color}`}>{pct.toFixed(1)}%</span>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden w-24 mx-auto">
              <div className={`h-full bg-gradient-to-r ${bar} rounded-full`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      },
      className: "w-[150px] min-w-[150px] max-w-[150px]"
    },
    {
      header: "Enc. / Unenc.",
      accessor: (row) => (
        <span className="text-xs font-semibold font-mono flex items-center justify-center gap-1.5">
          <span className="text-green-400">{fmtBytes(row.encrypted)}</span>
          <span className="text-slate-600">/</span>
          <span className="text-red-400">{fmtBytes(row.unencrypted)}</span>
        </span>
      ),
      className: "w-[180px] min-w-[180px] max-w-[180px]"
    },
    {
      header: <FilterSelect value={filterRisk} onChange={setFilterRisk} options={["Safe", "Moderate", "Vulnerable"]} placeholder="Risk Audit" />,
      accessor: (row) => {
        const config = RISK_CONFIG[row.risk_level] || RISK_CONFIG.Safe;
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${config.bg} ${config.color} mx-auto justify-center`}>
            {config.icon}
            {row.risk_level}
          </span>
        );
      },
      className: "w-[120px] min-w-[120px] max-w-[120px]"
    }
  ];

  return (
    <>
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            Device Risk Assessment
            {secDevicesLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            <span className="ml-auto text-xs text-slate-400 font-normal flex items-center gap-1">
              <Info className="w-3 h-3" />
              Based on encryption audit data. Click IP to inspect device.
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {secDevices.length === 0 && !secDevicesLoading ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              No encryption audit data available yet. The scheduler will populate this table automatically.
            </div>
          ) : (
            <DataTable
              data={secDevices}
              columns={secDeviceColumns}
              searchPlaceholder="Search by IP, device type, OS..."
              searchFilter={(row, query) => {
                const q = query.toLowerCase();
                const matchesSearch = (
                  (row.ip_address || "").toLowerCase().includes(q) ||
                  (row.device_label || "").toLowerCase().includes(q) ||
                  (row.device_type || "").toLowerCase().includes(q) ||
                  (row.os_label || "").toLowerCase().includes(q) ||
                  (row.risk_level || "").toLowerCase().includes(q)
                );
                const matchesRisk = filterRisk === "All" || row.risk_level === filterRisk;
                return matchesSearch && matchesRisk;
              }}
              pageSize={50}
            />
          )}
        </CardContent>
      </Card>

      {selectedDevice && (
        <DeviceDetailModal
          ip={selectedDevice.ip_address}
          onClose={() => setSelectedDevice(null)}
        />
      )}
    </>
  );
}
