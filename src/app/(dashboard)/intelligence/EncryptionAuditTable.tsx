"use client";

import React from "react";
import { DataTable } from "@/components/ui/DataTable";
import { TimestampCell } from "@/components/ui/TimestampCell";
import { ChevronRight } from "lucide-react";
import { IpDetails } from "@/components/ui/IpDetails";
import { fmtBytes } from "@/lib/utils";

interface EncryptionAuditTableProps {
  data: any[];
  isLoading: boolean;
  setSelectedDevice: (device: { ip: string; mac?: string } | null) => void;
}

export function EncryptionAuditTable({ data, isLoading, setSelectedDevice }: EncryptionAuditTableProps) {
  return (
    <DataTable 
      data={data} isLoading={isLoading}
      searchPlaceholder="Search by Device or IP..."
      searchFilter={(row: any, q: string) => {
        const query = q.toLowerCase();
        return (row.ip_address || '').toLowerCase().includes(query) || (row.device_label || '').toLowerCase().includes(query) || (row.mac_address || '').toLowerCase().includes(query);
      }}
      csvExport={{
        filename: `encryption-audit-${new Date().toISOString().slice(0,10)}.csv`,
        headers: ["Device Label", "MAC Address", "IP Address", "Encrypted Data", "Encrypted %", "Total Data", "Risk Level"],
        rowSerializer: (row: any) => [row.device_label || "", row.mac_address || "", row.ip_address || "", row.encrypted || 0, row.encrypted_pct || 0, row.total || 0, row.risk_level || ""]
      }}
      columns={[
        { 
          header: "Last Seen", 
          className: "w-[15%]",
          accessor: (row: any) => <TimestampCell timestamp={row.last_seen} showActiveStatus={true} /> 
        },
        { header: "#", accessor: (row, i) => i + 1, className: "w-[4%]" },
        { 
          header: "Device", 
          className: "w-[25%]",
          accessor: (row: any) => (
            <div className="flex flex-col items-center justify-center text-center">
              <span className="font-medium text-white">{row.device_label || row.ip_address}</span>
              <span className="text-xs text-muted-foreground mt-0.5">{row.mac_address}</span>
            </div>
          )
        },
        { 
          header: "IP Address", 
          className: "w-[20%]",
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
              {row.ip_address && <div className="mt-1 scale-90 origin-top"><IpDetails ip={row.ip_address} /></div>}
            </div>
          )
        },
        { 
          header: "Encrypted Data", 
          className: "w-[26%]",
          accessor: (row: any) => (
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-green-400 font-mono text-sm">{fmtBytes(row.encrypted)} ({row.encrypted_pct}%)</span>
              <span className="text-[10px] text-muted-foreground font-medium mt-0.5 uppercase tracking-wider">Total: {fmtBytes(row.total)}</span>
            </div>
          )
        },
        { 
          header: "Risk Level", 
          className: "w-[10%]",
          accessor: (row: any) => (
            <div className="flex items-center justify-center w-full">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                row.risk_level === 'medium' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'
              }`}>
                {row.risk_level === 'medium' ? 'Medium' : 'Safe'}
              </span>
            </div>
          )
        },
      ]}
    />
  );
}
