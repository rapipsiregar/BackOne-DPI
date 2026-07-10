"use client";

import { useState, useEffect } from "react";
import { useEvents } from "@/lib/api-with-context";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { DeviceDetailModal } from "@/components/ui/DeviceDetailModal";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Helper: format UTC ISO timestamp → Waktu WIB (UTC+7) formatted in English locale
function formatTimestampWIB(ts: string): string {
  try {
    return new Date(ts).toLocaleString('en-US', {
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
  const [selectedIp, setSelectedIp] = useState<string | null>(null);
  const [selectedMac, setSelectedMac] = useState<string | null>(null);
  const { data, isLoading } = useEvents();
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
    { header: "#", accessor: (row, i) => i + 1, className: "w-[60px] min-w-[60px] max-w-[60px]" },
    {
      header: "Timestamp (WIB)",
      accessor: (row) => (
        <span className="font-mono text-xs text-slate-300 whitespace-nowrap">
          {formatTimestampWIB(row.timestamp)}
        </span>
      ),
      className: "w-[180px] min-w-[180px] max-w-[180px]"
    },
    {
      header: "Severity",
      accessor: (row) => (
        <div className="flex items-center gap-2 justify-center">
          {getSeverityIcon(row.severity)}
          <span className="capitalize">{row.severity}</span>
        </div>
      ),
      className: "w-[120px] min-w-[120px] max-w-[120px]"
    },
    { header: "Event Type", accessor: (row) => row.event_type, className: "w-[130px] min-w-[130px] max-w-[130px]" },
    {
      header: "MAC Address",
      accessor: (row) => row.mac_address ? (
        <button
          onClick={() => setSelectedMac(row.mac_address)}
          className="font-mono text-xs text-emerald-400 hover:text-emerald-300 hover:underline text-center w-full focus:outline-none"
        >
          {row.mac_address}
        </button>
      ) : <span className="text-slate-500">-</span>,
      className: "w-[160px] min-w-[160px] max-w-[160px]"
    },
    {
      header: "Source IP",
      accessor: (row) => row.source_ip ? (
        <button
          onClick={() => setSelectedIp(row.source_ip)}
          className="text-blue-400 hover:text-blue-300 hover:underline font-mono text-xs text-center w-full focus:outline-none"
        >
          {row.source_ip}
        </button>
      ) : <span className="text-slate-500">-</span>,
      className: "w-[140px] min-w-[140px] max-w-[140px]"
    },
    {
      header: "Message",
      accessor: (row) => {
        const msg = row.message;
        const mac = row.mac_address;
        let content;
        if (!mac || !msg.includes(mac)) {
          content = <span className="text-slate-200 text-sm truncate">{msg}</span>;
        } else {
          // Highlight MAC in message with teal color
          const parts = msg.split(mac);
          content = (
            <span className="text-slate-200 text-sm truncate">
              {parts[0]}
              <span className="font-mono text-emerald-400 font-medium">{mac}</span>
              {parts[1]}
            </span>
          );
        }
        return (
          <div title={msg} className="truncate w-full block text-center cursor-help">
            {content}
          </div>
        );
      },
      className: "text-center w-full min-w-0 max-w-full"
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
            pageSize={50}
          />
        </CardContent>
      </Card>

      {selectedIp && (
        <DeviceDetailModal ip={selectedIp} onClose={() => setSelectedIp(null)} />
      )}

      {selectedMac && (
        <DeviceDetailModal ip="" mac={selectedMac} onClose={() => setSelectedMac(null)} />
      )}
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
export { EventsContent };
