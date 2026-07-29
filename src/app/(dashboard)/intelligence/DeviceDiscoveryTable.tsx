"use client";

import React from "react";
import { DataTable } from "@/components/ui/DataTable";
import { TimestampCell } from "@/components/ui/TimestampCell";
import { ChevronRight } from "lucide-react";
import { fmtBytes } from "@/lib/utils";

interface DeviceDiscoveryTableProps {
  data: any[];
  isLoading: boolean;
  setSelectedDevice: (device: { ip: string; mac?: string } | null) => void;
}

export function DeviceDiscoveryTable({ data, isLoading, setSelectedDevice }: DeviceDiscoveryTableProps) {
  return (
    <DataTable 
      data={data} isLoading={isLoading}
      searchPlaceholder="Search by IP, MAC, OS..."
      searchFilter={(row: any, q: string) => {
        const query = q.toLowerCase();
        return (row.ip_address || '').toLowerCase().includes(query) || (row.mac_address || '').toLowerCase().includes(query) || (row.os_label || '').toLowerCase().includes(query) || (row.device_type || '').toLowerCase().includes(query);
      }}
      csvExport={{
        filename: `device-discovery-${new Date().toISOString().slice(0,10)}.csv`,
        headers: ["IP Address", "MAC Address", "Device Type", "OS", "Manufacturer", "Download", "Upload", "Last Seen"],
        rowSerializer: (row: any) => [row.ip_address || "", row.mac_address || "", row.device_type || "", row.os_label || "", row.manufacturer || "", row.download || 0, row.upload || 0, row.last_seen || ""]
      }}
      columns={[
        { 
          header: "Last Seen", 
          className: "w-[15%]",
          accessor: (row: any) => <TimestampCell timestamp={row.last_seen} showActiveStatus={true} /> 
        },
        { header: "#", accessor: (row, i) => i + 1, className: "w-[4%]" },
        { 
          header: "IP Address", 
          className: "w-[16%]",
          accessor: (row: any) => (
            <div className="flex flex-col items-center justify-center">
              <button
                onClick={() => { if (row.ip_address) setSelectedDevice({ ip: row.ip_address, mac: row.mac_address }); }}
                className={`flex items-center justify-center gap-1 group text-center ${row.ip_address ? 'cursor-pointer' : 'cursor-default'}`}
                title={row.ip_address ? "Click to view device details" : ""}
              >
                <span className={`font-semibold transition-colors font-mono text-sm ${row.ip_address ? 'text-blue-400 group-hover:text-blue-300' : 'text-muted-foreground'}`}>
                  {row.ip_address || "Unknown IP"}
                </span>
                {row.ip_address && <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-blue-400 transition-colors" />}
              </button>
              <span className="text-xs text-muted-foreground mt-0.5">{row.mac_address}</span>
            </div>
          )
        },
        { header: "Device Profile", className: "w-[20%]", accessor: (row: any) => (
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-white font-medium">{row.device_type || "-"}</span>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5">{row.os_label || "-"}</span>
            </div>
        ) },
        { header: "Manufacturer", className: "w-[20%]", accessor: (row: any) => row.manufacturer || "-" },
        { header: "Bandwidth", className: "w-[25%]", accessor: (row: any) => (
            <div className="flex flex-col items-center justify-center text-center gap-0.5">
              <span className="text-cyan-400 text-xs font-mono">↓ {fmtBytes(row.download)}</span>
              <span className="text-green-400 text-xs font-mono">↑ {fmtBytes(row.upload)}</span>
            </div>
        ) },
      ]}
    />
  );
}
