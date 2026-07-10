"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable, Column } from "@/components/ui/DataTable";
import { DeviceDetailModal } from "@/components/ui/DeviceDetailModal";
import { useState, useEffect, useRef } from "react";
import { DeviceStat } from "@/lib/api";
import { useDevices } from "@/lib/api-with-context";
import { fmtBytes } from "@/lib/utils";
import { Loader2, ChevronRight, ChevronDown } from "lucide-react";

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
  const displayValue = placeholder;

  return (
    <div className="relative w-full max-w-[140px] mx-auto flex justify-center" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center gap-1.5 w-full py-1 font-medium text-sm transition-colors outline-none ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-white'}`}
      >
        <span className="truncate max-w-[110px]">{displayValue}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-500 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Animated Dropdown Menu */}
      <div 
        className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[200px] max-h-[300px] overflow-y-auto bg-slate-900 border border-border/50 rounded-lg shadow-xl z-50 flex flex-col py-1 transition-all duration-500 ease-in-out origin-top ${isOpen ? "opacity-100 scale-y-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-y-90 -translate-y-2 pointer-events-none"}`}
      >
        <button
          onClick={() => { onChange("All"); setIsOpen(false); }}
          className={`px-3 py-2 text-sm text-left whitespace-normal break-words transition-colors w-full ${value === "All" ? "bg-primary/20 text-white font-medium" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
        >
          Default
        </button>
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => { onChange(opt); setIsOpen(false); }}
            className={`px-3 py-2 text-sm text-left whitespace-normal break-words transition-colors w-full ${value === opt ? "bg-primary/20 text-white font-medium" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
            title={opt}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function DevicesPage() {
  const [mounted, setMounted] = useState(false);
  const devices = useDevices(5000);
  const [selectedDevice, setSelectedDevice] = useState<DeviceStat | null>(null);

  const [filterMan, setFilterMan] = useState<string>("All");
  const [filterType, setFilterType] = useState<string>("All");
  const [filterOS, setFilterOS] = useState<string>("All");
  
  const [sortDownload, setSortDownload] = useState<string>("All");
  const [sortUpload, setSortUpload] = useState<string>("All");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const manufacturers = Array.from(new Set(devices.data?.map(d => d.manufacturer).filter(Boolean) || [])).filter(v => v !== "-").sort() as string[];
  const deviceTypes = Array.from(new Set(devices.data?.map(d => d.device_type).filter(Boolean) || [])).filter(v => v !== "-").sort() as string[];
  const osLabels = Array.from(new Set(devices.data?.map(d => d.os_label).filter(Boolean) || [])).filter(v => v !== "-").sort() as string[];

  const columns: Column<DeviceStat>[] = [
    { 
      header: "Last Seen", 
      className: "w-[13%]",
      accessor: (row) => {
        const dateStr = row.last_seen ? new Date(row.last_seen) : null;
        if (!dateStr) return "-";
        return (
          <div className="flex flex-col items-center justify-center gap-0.5">
            <span className="text-sm font-medium">{dateStr.toLocaleDateString()}</span>
            <span className="text-[10px] text-muted-foreground">{dateStr.toLocaleTimeString()}</span>
          </div>
        );
      }
    },
    { header: "#", accessor: (row, i) => i + 1, className: "w-[4%]" },
    {
      header: "IP Address",
      className: "w-[12%]",
      accessor: (row) => (
        <div className="flex flex-col items-center justify-center">
          <button
            onClick={() => setSelectedDevice(row)}
            className="flex items-center justify-center gap-1 group text-center"
            title="Click to view device details"
          >
            <span className="font-semibold text-blue-400 group-hover:text-blue-300 transition-colors font-mono text-sm">
              {row.ip_address || "-"}
            </span>
            <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-blue-400 transition-colors" />
          </button>
          {row.device_label && (
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 truncate max-w-[120px]" title={row.device_label}>
              {row.device_label}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "MAC Address",
      className: "w-[17%]",
      accessor: (row) => {
        const isRouted = row.is_gateway_routed === 1;
        const hasMan = row.manufacturer && row.manufacturer !== "-" && row.manufacturer !== "Unknown";
        const info = hasMan ? row.manufacturer : (row.device_type && row.device_type !== "-" && row.device_type !== "Generic Client" ? row.device_type : "");

        return row.mac_address ? (
          <div className="flex flex-col items-center justify-center gap-0.5">
            <code className="text-xs bg-secondary/50 px-1 py-0.5 rounded text-muted-foreground w-fit font-mono">
              {row.mac_address}
            </code>
            {(isRouted || info) && (
              <span className={`text-[10px] font-sans font-medium ${isRouted ? "text-amber-500/90 italic" : "text-slate-400/80"}`}>
                {isRouted ? "Via Routed Gateway" : ""}
                {isRouted && info ? ` • ${info}` : (!isRouted ? info : "")}
              </span>
            )}
          </div>
        ) : (
          "-"
        );
      },
    },
    { 
      header: <FilterSelect value={filterType} onChange={setFilterType} options={deviceTypes} placeholder="Type" />, 
      accessor: (row) => row.device_type || "-", 
      className: "w-[11%]" 
    },
    { 
      header: <FilterSelect value={filterOS} onChange={setFilterOS} options={osLabels} placeholder="OS" />, 
      accessor: (row) => row.os_label || "-", 
      className: "w-[11%]" 
    },
    { 
      header: <FilterSelect value={filterMan} onChange={setFilterMan} options={manufacturers} placeholder="Manufacturer" />, 
      accessor: (row) => row.manufacturer || "-", 
      className: "w-[14%]" 
    },
    {
      header: <FilterSelect value={sortDownload} onChange={(val) => { setSortDownload(val); setSortUpload("All"); }} options={["Descending", "Ascending"]} placeholder="Download" />,
      accessor: (row) => <span className="text-cyan-400">{fmtBytes(row.download)}</span>,
      className: "w-[9%]",
    },
    {
      header: <FilterSelect value={sortUpload} onChange={(val) => { setSortUpload(val); setSortDownload("All"); }} options={["Descending", "Ascending"]} placeholder="Upload" />,
      accessor: (row) => <span className="text-green-400">{fmtBytes(row.upload)}</span>,
      className: "w-[9%]",
    },
  ];

  let processedData = [...(devices.data || [])];
  if (sortUpload !== "All") {
    processedData.sort((a, b) => sortUpload === "Descending" ? b.upload - a.upload : a.upload - b.upload);
  } else if (sortDownload !== "All") {
    processedData.sort((a, b) => sortDownload === "Descending" ? b.download - a.download : a.download - b.download);
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Devices
            {devices.isLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
          </h2>
          <p className="text-muted-foreground mt-1">
            Monitor and manage connected network devices.{" "}
            <span className="text-slate-500 text-xs">Click an IP to see app usage &amp; flows.</span>
          </p>
        </div>
      </div>

      <Card className="bg-card/80 backdrop-blur-xl border-border/50 animate-slide-up" style={{ animationDelay: "100ms" }}>
        <CardHeader className="border-b border-border/50 pb-4 mb-4">
          <CardTitle className="text-lg text-white">
            Active Devices {devices.data ? `(${devices.data.length})` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={processedData}
            columns={columns}
            searchPlaceholder="Search devices by IP, MAC..."
            searchFilter={(row, query) => {
              const q = query.trim().toLowerCase();
              const matchesSearch = (
                (row.ip_address || "").toLowerCase().includes(q) ||
                (row.mac_address || "").toLowerCase().includes(q) ||
                (row.os_label || "").toLowerCase().includes(q) ||
                (row.device_type || "").toLowerCase().includes(q)
              );

              const matchesMan = filterMan === "All" || row.manufacturer === filterMan;
              const matchesType = filterType === "All" || row.device_type === filterType;
              const matchesOS = filterOS === "All" || row.os_label === filterOS;

              return matchesSearch && matchesMan && matchesType && matchesOS;
            }}
            csvExport={{
              filename: `devices-${new Date().toISOString().slice(0,10)}.csv`,
              headers: ["IP Address", "Device Label", "MAC Address", "Device Type", "OS", "Manufacturer", "Download (bytes)", "Upload (bytes)", "Last Seen"],
              rowSerializer: (row) => [
                row.ip_address || "",
                row.device_label || "",
                row.mac_address || "",
                row.device_type || "",
                row.os_label || "",
                row.manufacturer || "",
                row.download ?? 0,
                row.upload ?? 0,
                row.last_seen ? new Date(row.last_seen).toISOString() : "",
              ],
            }}
          />
        </CardContent>
      </Card>

      {/* Device Detail Modal */}
      {selectedDevice && (
        <DeviceDetailModal
          ip={selectedDevice.ip_address}
          deviceData={selectedDevice}
          onClose={() => setSelectedDevice(null)}
        />
      )}
    </div>
  );
}
