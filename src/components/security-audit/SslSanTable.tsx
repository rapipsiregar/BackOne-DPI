// src/components/security-audit/SslSanTable.tsx
"use client";

import { useSslSans, SslSanStat } from "@/lib/api-with-context";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2, Info } from "lucide-react";
import { fmtBytes } from "@/lib/utils";

export default function SslSanTable() {
  const { data, isLoading } = useSslSans(100);

  const columns: Column<SslSanStat>[] = [
    { 
      header: "#", 
      accessor: (_, i) => i + 1, 
      className: "w-[50px] min-w-[50px] max-w-[50px]" 
    },
    { 
      header: "Subject Alternative Name (SAN)", 
      accessor: (row) => (
        <div 
          title={row.alt_name || '-'} 
          className="font-mono text-xs text-blue-400 hover:text-blue-300 truncate w-full block text-center cursor-help"
        >
          {row.alt_name || '-'}
        </div>
      ),
      className: "w-[300px] min-w-[300px] max-w-[300px]"
    },
    { 
      header: "Download", 
      accessor: (row) => <span className="text-blue-400">{fmtBytes(row.download)}</span>, 
      className: "w-[120px] min-w-[120px] max-w-[120px]" 
    },
    { 
      header: "Upload", 
      accessor: (row) => <span className="text-green-500">{fmtBytes(row.upload)}</span>, 
      className: "w-[120px] min-w-[120px] max-w-[120px]" 
    },
    { 
      header: "Active Flows", 
      accessor: (row) => <span className="text-purple-400 font-mono">{row.flows.toLocaleString()}</span>, 
      className: "w-[120px] min-w-[120px] max-w-[120px]" 
    },
    { 
      header: "Total Volume", 
      accessor: (row) => <span className="font-semibold text-white">{fmtBytes(row.total)}</span>, 
      className: "w-[130px] min-w-[130px] max-w-[130px]" 
    },
  ];

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          Subject Alternative Name (SAN) Audit
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          <span className="ml-auto text-xs text-slate-400 font-normal flex items-center gap-1">
            <Info className="w-3 h-3" />
            TLS Certificate Domains and Subdomains parsed in real-time.
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 && !isLoading ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            No SSL/TLS certificate SAN data available yet.
          </div>
        ) : (
          <DataTable
            data={data}
            columns={columns}
            searchPlaceholder="Search by hostname / domain..."
            searchFilter={(row, query) => (row.alt_name || "").toLowerCase().includes(query.toLowerCase())}
            pageSize={50}
          />
        )}
      </CardContent>
    </Card>
  );
}
