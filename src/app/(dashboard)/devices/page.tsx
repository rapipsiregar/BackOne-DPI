"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable, Column } from "@/components/ui/DataTable";
import { DeviceDetailModal } from "@/components/ui/DeviceDetailModal";
import { useState, useEffect, useRef } from "react";
import { TimestampCell } from "@/components/ui/TimestampCell";
import { DeviceStat } from "@/lib/api";
import { useDevices } from "@/lib/api-with-context";
import { fmtBytes } from "@/lib/utils";
import { Loader2, ChevronRight, ChevronDown } from "lucide-react";

import { UniversalFilters, useUniversalFilterState, FilterConfig } from "@/components/ui/UniversalFilters";
import { HelpTrigger } from "@/components/help/HelpTrigger";

export default function DevicesPage() {
  const [mounted, setMounted] = useState(false);
  const devices = useDevices();
  const [selectedDevice, setSelectedDevice] = useState<DeviceStat | null>(null);

  const { 
    filters, dateFrom, dateTo, 
    handleFilterChange, setDateFrom, setDateTo, 
    handleReset, activeCount 
  } = useUniversalFilterState();

  useEffect(() => {
    setMounted(true);
    document.title = "Devices | BackOne - Deep Package Inspection";
  }, []);

  if (!mounted) return null;

  const all = devices.data || [];

  const opts = (key: string) => {
    const raw = Array.from(new Set(all.map((r: any) => String(r[key] || "")).filter(Boolean)));
    return raw.sort();
  };

  const filterConfigs: FilterConfig[] = [
    { id: "device_type", label: "Device Type", type: "select", value: filters.device_type, options: opts("device_type") },
    { id: "os_label", label: "OS", type: "select", value: filters.os_label, options: opts("os_label") },
    { id: "manufacturer", label: "Manufacturer", type: "select", value: filters.manufacturer, options: opts("manufacturer") },
    { id: "sort_download", label: "Sort Download", type: "select", value: filters.sort_download, options: ["Descending", "Ascending"] },
    { id: "sort_upload", label: "Sort Upload", type: "select", value: filters.sort_upload, options: ["Descending", "Ascending"] },
  ];

  const columns: Column<DeviceStat>[] = [
    { 
      header: "Last Seen", 
      className: "w-[13%]",
      accessor: (row) => <TimestampCell timestamp={row.last_seen} showActiveStatus={true} />
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
      header: "Type", 
      accessor: (row) => row.device_type || "-", 
      className: "w-[11%]" 
    },
    { 
      header: "OS", 
      accessor: (row) => row.os_label || "-", 
      className: "w-[11%]" 
    },
    { 
      header: "Manufacturer", 
      accessor: (row) => row.manufacturer || "-", 
      className: "w-[14%]" 
    },
    {
      header: "Download",
      accessor: (row) => <span className="text-cyan-400">{fmtBytes(row.download)}</span>,
      className: "w-[9%]",
    },
    {
      header: "Upload",
      accessor: (row) => <span className="text-green-400">{fmtBytes(row.upload)}</span>,
      className: "w-[9%]",
    },
  ];

  const filteredData = all.filter((row: any) => {
    if (filters.device_type && filters.device_type !== "All" && row.device_type !== filters.device_type) return false;
    if (filters.os_label && filters.os_label !== "All" && row.os_label !== filters.os_label) return false;
    if (filters.manufacturer && filters.manufacturer !== "All" && row.manufacturer !== filters.manufacturer) return false;
    
    if (dateFrom || dateTo) {
      const d = row.last_seen ? new Date(row.last_seen).toISOString().slice(0, 10) : "";
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
    }
    return true;
  });

  let processedData = [...filteredData];
  const sortUpload = filters.sort_upload || "All";
  const sortDownload = filters.sort_download || "All";
  
  if (sortUpload !== "All") {
    processedData.sort((a, b) => sortUpload === "Descending" ? b.upload - a.upload : a.upload - b.upload);
  } else if (sortDownload !== "All") {
    processedData.sort((a, b) => sortDownload === "Descending" ? b.download - a.download : a.download - b.download);
  }

  const minTime = all.reduce((min: number, r: any) => {
    if (r.last_seen) {
      const time = new Date(r.last_seen).getTime();
      if (isFinite(time) && time < min) return time;
    }
    return min;
  }, Infinity);
  const minDate = minTime !== Infinity ? new Date(minTime).toISOString().slice(0, 10) : "2024-01-01";

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
        <HelpTrigger pageId="devices" />
      </div>

      <UniversalFilters
        filters={filterConfigs}
        onChange={(id, val) => {
          if (id === 'sort_download') {
            handleFilterChange('sort_download', val);
            handleFilterChange('sort_upload', 'All');
          } else if (id === 'sort_upload') {
            handleFilterChange('sort_upload', val);
            handleFilterChange('sort_download', 'All');
          } else {
            handleFilterChange(id, val);
          }
        }}
        showDateRange={true}
        dateFrom={dateFrom}
        dateTo={dateTo}
        minDate={minDate}
        onDateChange={(f, t) => { setDateFrom(f); setDateTo(t); }}
        activeFilterCount={activeCount}
        onReset={handleReset}
      />

      <Card className="bg-card/80 backdrop-blur-xl border-border/50 animate-slide-up" style={{ animationDelay: "100ms" }}>
        <CardHeader className="border-b border-border/50 pb-4 mb-4">
          <CardTitle className="text-white">Active Devices ({processedData.length})</CardTitle>
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

              return matchesSearch;
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
