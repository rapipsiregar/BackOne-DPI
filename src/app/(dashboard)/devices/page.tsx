"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable, Column } from "@/components/ui/DataTable";
import { DeviceDetailModal } from "@/components/ui/DeviceDetailModal";
import { useState, useEffect } from "react";
import { useDevices, DeviceStat } from "@/lib/api";
import { fmtBytes } from "@/lib/utils";
import { Loader2, ChevronRight } from "lucide-react";

export default function DevicesPage() {
  const [mounted, setMounted] = useState(false);
  const devices = useDevices(100);
  const [selectedDevice, setSelectedDevice] = useState<DeviceStat | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const columns: Column<DeviceStat>[] = [
    { header: "#", accessor: (row, i) => i + 1 },
    {
      header: "IP Address",
      accessor: (row) => (
        <button
          onClick={() => setSelectedDevice(row)}
          className="flex items-center gap-1.5 group text-left"
          title="Click to view device details"
        >
          <span className="font-medium text-blue-400 group-hover:text-blue-300 transition-colors font-mono text-sm">
            {row.ip_address || "-"}
          </span>
          <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-blue-400 transition-colors" />
        </button>
      ),
    },
    {
      header: "MAC Address",
      accessor: (row) =>
        row.mac_address ? (
          <div className="flex flex-col gap-1">
            <code className="text-xs bg-secondary/50 px-1 py-0.5 rounded text-muted-foreground w-fit">
              {row.mac_address}
            </code>
            {row.is_gateway_routed === 1 && (
              <span className="text-[10px] text-amber-500/80 font-sans italic">
                Via Routed Gateway
              </span>
            )}
          </div>
        ) : (
          "-"
        ),
    },
    { header: "Type", accessor: (row) => row.device_type || "-" },
    { header: "OS", accessor: (row) => row.os_label || "-" },
    { header: "Manufacturer", accessor: (row) => row.manufacturer || "-" },
    {
      header: "Download",
      accessor: (row) => <span className="text-cyan-400">{fmtBytes(row.download)}</span>,
      className: "text-right",
    },
    {
      header: "Upload",
      accessor: (row) => <span className="text-green-400">{fmtBytes(row.upload)}</span>,
      className: "text-right",
    },
  ];

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
            data={devices.data || []}
            columns={columns}
            searchPlaceholder="Search devices by IP, MAC, OS..."
            searchFilter={(row, query) => {
              const q = query.toLowerCase();
              return (
                (row.ip_address || "").toLowerCase().includes(q) ||
                (row.mac_address || "").toLowerCase().includes(q) ||
                (row.os_label || "").toLowerCase().includes(q) ||
                (row.device_type || "").toLowerCase().includes(q)
              );
            }}
          />
        </CardContent>
      </Card>

      {/* Device Detail Modal */}
      {selectedDevice && (
        <DeviceDetailModal
          ip={selectedDevice.ip_address}
          deviceLabel={selectedDevice.device_label}
          macAddress={selectedDevice.mac_address}
          onClose={() => setSelectedDevice(null)}
        />
      )}
    </div>
  );
}
