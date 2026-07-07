"use client";

import { useState, useEffect } from "react";
import { useDNS } from "@/lib/api";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2 } from "lucide-react";

export default function DNSPage() {
  const [mounted, setMounted] = useState(false);
  const { data, isLoading } = useDNS(100); // fetch 100 DNS queries

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const columns: Column<typeof data[0]>[] = [
    { header: "#", accessor: (row, i) => i + 1 },
    { 
      header: "Domain", 
      accessor: (row) => <span className="font-medium text-white">{row.domain}</span> 
    },
    { header: "Application", accessor: (row) => row.app_label || "-" },
    { header: "Category", accessor: (row) => row.category || "-" },
    { 
      header: "Query Count", 
      accessor: (row) => <span className="text-purple-400">{row.query_count.toLocaleString()}</span> 
    }
  ];

  return (
    <div className="space-y-6">
<div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          DNS Intelligence
          {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
        </h2>
      </div>
      

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-white">Top DNS Queries ({data.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={data}
            columns={columns}
            searchPlaceholder="Search by domain, application, or category..."
            searchFilter={(row, query) => {
              const q = query.toLowerCase();
              return (
                (row.domain || "").toLowerCase().includes(q) ||
                (row.app_label || "").toLowerCase().includes(q) ||
                (row.category || "").toLowerCase().includes(q)
              );
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
