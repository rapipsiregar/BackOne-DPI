"use client";

import { useState, useEffect } from "react";
import { useFlows } from "@/lib/api";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2 } from "lucide-react";
import { fmtBytes } from "@/lib/utils";

export default function FlowsPage() {
  const [mounted, setMounted] = useState(false);
  const { data, isLoading } = useFlows(100); // fetch 100 flows

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const columns: Column<typeof data[0]>[] = [
    { header: "#", accessor: (row, i) => i + 1 },
    { header: "Flow ID", accessor: (row) => row.flow_id },
    { header: "Src IP", accessor: (row) => <span className="text-blue-400">{row.src_ip}</span> },
    { header: "Dst IP", accessor: (row) => <span className="text-blue-400">{row.dst_ip}</span> },
    { header: "Dst Port", accessor: (row) => row.dst_port },
    { header: "Protocol", accessor: (row) => row.protocol },
    { header: "App / Domain", accessor: (row) => row.app_label || row.domain || "-" },
    { 
      header: "Download", 
      accessor: (row) => <span className="text-blue-400">{fmtBytes(row.bytes_download)}</span> 
    },
    { 
      header: "Upload", 
      accessor: (row) => <span className="text-green-500">{fmtBytes(row.bytes_upload)}</span> 
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          Active Flows
          {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
        </h2>
      </div>
      
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-white">Active Flows ({data.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={data}
            columns={columns}
            searchPlaceholder="Search flows by IP, App, or Domain..."
            searchFilter={(row, query) => {
              const q = query.toLowerCase();
              return (
                (row.src_ip || "").toLowerCase().includes(q) ||
                (row.dst_ip || "").toLowerCase().includes(q) ||
                (row.app_label || "").toLowerCase().includes(q) ||
                (row.domain || "").toLowerCase().includes(q) ||
                (row.protocol || "").toLowerCase().includes(q)
              );
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
