"use client";

import { useState } from "react";
import { TlsVersionStat, TlsCipherStat } from "@/lib/api";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { fmtBytes } from "@/lib/utils";
import { TimestampCell } from "@/components/ui/TimestampCell";
import { TlsCipherDetailModal } from "./TlsCipherDetailModal";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

interface Props {
  versionsData: TlsVersionStat[];
  ciphersData: TlsCipherStat[];
}

export default function TlsTables({ versionsData, ciphersData }: Props) {
  const [selectedCipher, setSelectedCipher] = useState<TlsCipherStat | null>(null);

  const versionColumns: Column<TlsVersionStat>[] = [
    {
      header: "Timestamp",
      className: "w-[120px] min-w-[120px] text-center",
      accessor: (row) => <TimestampCell timestamp={row.timestamp} showActiveStatus={false} />
    },
    { header: "#", accessor: (row, i) => i + 1, className: "w-[40px] min-w-[40px]" },
    { 
      header: "TLS Version", 
      accessor: (row) => (
        <div title={row.tls_version || '-'} className="font-semibold text-white truncate w-full block text-center cursor-help">
          {row.tls_version || '-'}
        </div>
      ),
      className: "w-[120px] min-w-[120px]"
    },
    { header: "Download", accessor: (row) => <span className="text-blue-400">{fmtBytes(row.download)}</span>, className: "w-[80px] min-w-[80px]" },
    { header: "Upload", accessor: (row) => <span className="text-green-500">{fmtBytes(row.upload)}</span>, className: "w-[80px] min-w-[80px]" },
    { header: "Total", accessor: (row) => <span className="font-medium text-white">{fmtBytes(row.total)}</span>, className: "w-[80px] min-w-[80px]" },
  ];

  const cipherColumns: Column<TlsCipherStat>[] = [
    {
      header: "Timestamp",
      className: "w-[120px] min-w-[120px] text-center",
      accessor: (row) => <TimestampCell timestamp={row.timestamp} showActiveStatus={false} />
    },
    { header: "#", accessor: (row, i) => i + 1, className: "w-[40px] min-w-[40px]" },
    { 
      header: "Cipher Suite", 
      accessor: (row) => {
        const s = row.security_status || 'Unknown';
        let Icon = Shield;
        let color = "text-slate-400";
        if (s === 'Secure') { Icon = ShieldCheck; color = "text-emerald-400"; }
        else if (s === 'Weak') { Icon = ShieldAlert; color = "text-amber-400"; }
        else if (s === 'Vulnerable') { Icon = ShieldAlert; color = "text-red-400"; }

        return (
          <div className="flex flex-col items-center justify-center gap-1 w-full">
            <button
              onClick={() => setSelectedCipher(row)}
              className="text-purple-400 hover:text-purple-300 transition-colors font-mono truncate max-w-[200px] sm:max-w-[200px] md:max-w-[350px] block"
              title={row.tls_cipher || '-'}
            >
              {row.tls_cipher || '-'}
            </button>
            {s !== 'Unknown' && (
              <div className={"flex items-center gap-1 text-[10px] uppercase font-semibold " + color} title={row.description}>
                <Icon className="w-3 h-3" />
                {s}
              </div>
            )}
          </div>
        );
      },
      className: "w-[30%] min-w-[200px]"
    },
    { header: "Download", accessor: (row) => <span className="text-blue-400">{fmtBytes(row.download)}</span>, className: "w-[80px] min-w-[80px]" },
    { header: "Upload", accessor: (row) => <span className="text-green-500">{fmtBytes(row.upload)}</span>, className: "w-[80px] min-w-[80px]" },
    { header: "Total", accessor: (row) => <span className="font-medium text-white">{fmtBytes(row.total)}</span>, className: "w-[80px] min-w-[80px]" },
  ];

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-2">
        {/* TLS Versions Table */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 max-w-full overflow-hidden flex flex-col">
          <CardHeader>
            <CardTitle className="text-white">TLS Versions Overview</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-w-0 p-2 sm:p-6 overflow-hidden">
            <div className="overflow-x-auto w-full custom-scrollbar">
              <DataTable
                data={versionsData}
                columns={versionColumns}
                searchPlaceholder="Search versions..."
                searchFilter={(row, query) => (row.tls_version || "").toLowerCase().includes(query.toLowerCase())}
                pageSize={50}
              />
            </div>
          </CardContent>
        </Card>

        {/* TLS Ciphers Table */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 max-w-full overflow-hidden flex flex-col">
          <CardHeader>
            <CardTitle className="text-white">Top TLS Cipher Suites</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-w-0 p-2 sm:p-6 overflow-hidden">
            <div className="overflow-x-auto w-full custom-scrollbar">
              <DataTable
                data={ciphersData}
                columns={cipherColumns}
                searchPlaceholder="Search ciphers..."
                searchFilter={(row, query) => (row.tls_cipher || "").toLowerCase().includes(query.toLowerCase())}
                pageSize={50}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedCipher && (
        <TlsCipherDetailModal
          cipher={selectedCipher}
          onClose={() => setSelectedCipher(null)}
        />
      )}
    </>
  );
}
