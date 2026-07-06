"use client";

import { useState, useEffect } from "react";
import { useEvents } from "@/lib/api";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2, AlertCircle, Info, AlertTriangle } from "lucide-react";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Helper: format UTC ISO timestamp → Waktu WIB (UTC+7)
function formatTimestampWIB(ts: string): string {
  try {
    return new Date(ts).toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return ts;
  }
}

function EventsContent() {
  const [mounted, setMounted] = useState(false);
  const { data, isLoading } = useEvents(100); // fetch 100 events
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'high':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'medium':
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const columns: Column<typeof data[0]>[] = [
    { header: "#", accessor: (row, i) => i + 1 },
    {
      header: "Timestamp (WIB)",
      accessor: (row) => (
        <span className="font-mono text-xs text-slate-300 whitespace-nowrap">
          {formatTimestampWIB(row.timestamp)}
        </span>
      )
    },
    {
      header: "Severity",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          {getSeverityIcon(row.severity)}
          <span className="capitalize">{row.severity}</span>
        </div>
      )
    },
    { header: "Event Type", accessor: (row) => row.event_type },
    {
      header: "MAC Address",
      accessor: (row) => row.mac_address
        ? <span className="font-mono text-xs text-emerald-400">{row.mac_address}</span>
        : <span className="text-slate-500">-</span>
    },
    {
      header: "Source IP",
      accessor: (row) => <span className="text-blue-400 font-mono text-xs">{row.source_ip || "-"}</span>
    },
    {
      header: "Message",
      accessor: (row) => {
        const msg = row.message;
        const mac = row.mac_address;
        if (!mac || !msg.includes(mac)) {
          return <span className="text-slate-200 text-sm">{msg}</span>;
        }
        // Highlight MAC in message with teal color (like Netify)
        const parts = msg.split(mac);
        return (
          <span className="text-slate-200 text-sm">
            {parts[0]}
            <span className="font-mono text-emerald-400 font-medium">{mac}</span>
            {parts[1]}
          </span>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          Network Events
          {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
        </h2>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-white">Recent Events ({data.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={data}
            columns={columns}
            searchPlaceholder="Search by event type, severity, MAC, IP, or message..."
            searchFilter={(row, query) => {
              const q = query.toLowerCase();
              return (
                (row.event_type || "").toLowerCase().includes(q) ||
                (row.severity || "").toLowerCase().includes(q) ||
                (row.source_ip || "").toLowerCase().includes(q) ||
                (row.mac_address || "").toLowerCase().includes(q) ||
                (row.message || "").toLowerCase().includes(q)
              );
            }}
            getRowClassName={(row) => {
              return highlightId && row.id.toString() === highlightId
                ? "bg-yellow-500/10 border-l-2 border-yellow-500 animate-pulse font-semibold"
                : "";
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <EventsContent />
    </Suspense>
  );
}
