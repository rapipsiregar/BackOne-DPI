"use client";

import React from "react";
import { DataTable } from "@/components/ui/DataTable";
import { TimestampCell } from "@/components/ui/TimestampCell";
import { ChevronRight } from "lucide-react";

interface ServerDiscoveryTableProps {
  data: any[];
  isLoading: boolean;
  setSelectedDevice: (device: { ip: string; mac?: string } | null) => void;
}

export function ServerDiscoveryTable({ data, isLoading, setSelectedDevice }: ServerDiscoveryTableProps) {
  return (
    <DataTable 
      data={data} isLoading={isLoading}
      searchPlaceholder="Search by IP, MAC, Type..."
      searchFilter={(row: any, q: string) => {
        const query = q.toLowerCase();
        return (row.ip_address || '').toLowerCase().includes(query) || (row.mac_address || '').toLowerCase().includes(query) || (row.server_type || '').toLowerCase().includes(query) || (row.os_label || '').toLowerCase().includes(query);
      }}
      csvExport={{
        filename: `server-discovery-${new Date().toISOString().slice(0,10)}.csv`,
        headers: ["IP Address", "MAC Address", "Server Type", "Port", "OS"],
        rowSerializer: (row: any) => [row.ip_address || "", row.mac_address || "", row.server_type || "", row.port || "", row.os_label || ""]
      }}
      columns={[
        { 
          header: "Last Seen", 
          className: "w-[15%]",
          accessor: (row: any) => <TimestampCell timestamp={row.last_seen} showActiveStatus={true} /> 
        },
        { header: "#", accessor: (row, i) => i + 1, className: "w-[4%]" },
        {
          header: "Server IP",
          className: "w-[25%]",
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
        { header: "Server Type", className: "w-[28%]", accessor: (row: any) => (
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-white font-medium">{row.server_type}</span>
            {row.port > 0 && <span className="text-[10px] text-purple-400 font-mono font-medium mt-0.5">Port {row.port}</span>}
          </div>
        ) },
        { header: "OS / Platform", className: "w-[28%]", accessor: (row: any) => row.os_label },
      ]}
    />
  );
}
