"use client";

import { useState, useEffect } from "react";
import { useEvents } from "@/lib/api";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2, AlertCircle, Info, AlertTriangle } from "lucide-react";

export default function EventsPage() {
  const [mounted, setMounted] = useState(false);
  const { data, isLoading } = useEvents(100); // fetch 100 events

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
      header: "Timestamp", 
      accessor: (row) => {
        try {
          return new Date(row.timestamp).toLocaleString();
        } catch {
          return row.timestamp;
        }
      }
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
      header: "Source IP", 
      accessor: (row) => <span className="text-blue-400">{row.source_ip || "-"}</span> 
    },
    { header: "Message", accessor: (row) => row.message }
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
            searchPlaceholder="Search by event type, severity, IP, or message..."
            searchFilter={(row, query) => {
              const q = query.toLowerCase();
              return (
                (row.event_type || "").toLowerCase().includes(q) ||
                (row.severity || "").toLowerCase().includes(q) ||
                (row.source_ip || "").toLowerCase().includes(q) ||
                (row.message || "").toLowerCase().includes(q)
              );
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
