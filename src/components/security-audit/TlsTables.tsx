// src/components/security-audit/TlsTables.tsx
"use client";

import { TlsVersionStat, TlsCipherStat } from "@/lib/api";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { fmtBytes } from "@/lib/utils";

interface Props {
  versionsData: TlsVersionStat[];
  ciphersData: TlsCipherStat[];
}

export default function TlsTables({ versionsData, ciphersData }: Props) {
  const versionColumns: Column<TlsVersionStat>[] = [
    { header: "#", accessor: (row, i) => i + 1, className: "w-[40px] min-w-[40px] max-w-[40px]" },
    { 
      header: "TLS Version", 
      accessor: (row) => (
        <div title={row.tls_version || '-'} className="font-semibold text-white truncate w-full block text-center cursor-help">
          {row.tls_version || '-'}
        </div>
      ),
      className: "w-[120px] min-w-[120px] max-w-[120px]"
    },
    { header: "Download", accessor: (row) => <span className="text-blue-400">{fmtBytes(row.download)}</span>, className: "w-[90px] min-w-[90px] max-w-[90px]" },
    { header: "Upload", accessor: (row) => <span className="text-green-500">{fmtBytes(row.upload)}</span>, className: "w-[90px] min-w-[90px] max-w-[90px]" },
    { header: "Total Volume", accessor: (row) => <span className="font-medium text-white">{fmtBytes(row.total)}</span>, className: "w-[110px] min-w-[110px] max-w-[110px]" },
  ];

  const cipherColumns: Column<TlsCipherStat>[] = [
    { header: "#", accessor: (row, i) => i + 1, className: "w-[40px] min-w-[40px] max-w-[40px]" },
    { 
      header: "Cipher Suite", 
      accessor: (row) => (
        <div title={row.tls_cipher || '-'} className="text-purple-400 truncate w-full block text-center cursor-help">
          {row.tls_cipher || '-'}
        </div>
      ),
      className: "w-[200px] min-w-[200px] max-w-[200px]"
    },
    { header: "Download", accessor: (row) => <span className="text-blue-400">{fmtBytes(row.download)}</span>, className: "w-[90px] min-w-[90px] max-w-[90px]" },
    { header: "Upload", accessor: (row) => <span className="text-green-500">{fmtBytes(row.upload)}</span>, className: "w-[90px] min-w-[90px] max-w-[90px]" },
    { header: "Total Volume", accessor: (row) => <span className="font-medium text-white">{fmtBytes(row.total)}</span>, className: "w-[110px] min-w-[110px] max-w-[110px]" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* TLS Versions Table */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-white">TLS Versions Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={versionsData}
            columns={versionColumns}
            searchPlaceholder="Search versions..."
            searchFilter={(row, query) => (row.tls_version || "").toLowerCase().includes(query.toLowerCase())}
            pageSize={50}
          />
        </CardContent>
      </Card>

      {/* TLS Ciphers Table */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-white">Top TLS Cipher Suites</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={ciphersData}
            columns={cipherColumns}
            searchPlaceholder="Search ciphers..."
            searchFilter={(row, query) => (row.tls_cipher || "").toLowerCase().includes(query.toLowerCase())}
            pageSize={50}
          />
        </CardContent>
      </Card>
    </div>
  );
}
