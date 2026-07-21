"use client";

import { useState, useEffect } from "react";
import { TimestampCell } from "@/components/ui/TimestampCell";
import { useEvents } from "@/lib/api-with-context";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { DeviceDetailModal } from "@/components/ui/DeviceDetailModal";
import { UniversalFilters, useUniversalFilterState, FilterConfig } from "@/components/ui/UniversalFilters";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { HelpTrigger } from "@/components/help/HelpTrigger";



function EventsContent() {
  const [mounted, setMounted] = useState(false);
  const [selectedIp, setSelectedIp] = useState<string | null>(null);
  const [selectedMac, setSelectedMac] = useState<string | null>(null);
  const { data, isLoading } = useEvents();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const { 
    filters, dateFrom, dateTo, 
    handleFilterChange, setDateFrom, setDateTo, 
    handleReset, activeCount 
  } = useUniversalFilterState();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const all = data || [];

  const opts = (key: string) => {
    const raw = Array.from(new Set(all.map((r: any) => String(r[key] || "")).filter(Boolean)));
    return raw.sort();
  };

  const filterConfigs: FilterConfig[] = [
    { id: "severity", label: "Severity", type: "select", value: filters.severity, options: opts("severity") },
    { id: "event_type", label: "Event Type", type: "select", value: filters.event_type, options: opts("event_type") },
    { id: "source_ip", label: "Source IP", type: "select", value: filters.source_ip, options: opts("source_ip") },
    { id: "mac_address", label: "MAC Address", type: "select", value: filters.mac_address, options: opts("mac_address") },
  ];

  const filteredData = all.filter((row: any) => {
    if (filters.severity && filters.severity !== "All" && row.severity !== filters.severity) return false;
    if (filters.event_type && filters.event_type !== "All" && row.event_type !== filters.event_type) return false;
    if (filters.source_ip && filters.source_ip !== "All" && row.source_ip !== filters.source_ip) return false;
    if (filters.mac_address && filters.mac_address !== "All" && row.mac_address !== filters.mac_address) return false;
    
    if (dateFrom || dateTo) {
      const d = row.timestamp ? new Date(row.timestamp).toISOString().slice(0, 10) : "";
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
    }
    return true;
  });

  const minTime = all.reduce((min: number, r: any) => {
    if (r.timestamp) {
      const time = new Date(r.timestamp).getTime();
      if (isFinite(time) && time < min) return time;
    }
    return min;
  }, Infinity);
  const minDate = minTime !== Infinity ? new Date(minTime).toISOString().slice(0, 10) : "2024-01-01";

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
      accessor: (row) => <TimestampCell timestamp={row.timestamp} showActiveStatus={false} />,
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
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Network Events
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
          </h2>
          <p className="text-muted-foreground mt-1">Real-time system, security, and interface network log events.</p>
        </div>
        <HelpTrigger pageId="events" />
      </div>
      
      <UniversalFilters
        filters={filterConfigs}
        onChange={handleFilterChange}
        showDateRange={true}
        dateFrom={dateFrom}
        dateTo={dateTo}
        minDate={minDate}
        onDateChange={(f, t) => { setDateFrom(f); setDateTo(t); }}
        activeFilterCount={activeCount}
        onReset={handleReset}
      />
      
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-white">Recent Events ({filteredData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredData}
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
