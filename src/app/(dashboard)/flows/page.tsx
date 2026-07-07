"use client";

import { useState, useEffect } from "react";
import { useFlows } from "@/lib/api";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2 } from "lucide-react";
import { fmtBytes } from "@/lib/utils";
import { IpDetails } from "@/components/ui/IpDetails";

function explainAppOrPort(appLabel: string | null, domain: string | null, port: number) {
  const label = appLabel || domain || "";
  const portStr = String(port);
  
  const matches: Record<string, string> = {
    "1433": "MSSQL Database Server",
    "1434": "MSSQL Monitor Server",
    "3306": "MySQL/MariaDB Database Server",
    "5432": "PostgreSQL Database Server",
    "1521": "Oracle Database Server",
    "27017": "MongoDB Database Server",
    "6379": "Redis Key-Value Cache",
    "80": "Unencrypted Web Traffic (HTTP)",
    "443": "Encrypted Web Traffic (HTTPS/TLS)",
    "22": "SSH Remote Management / SFTP",
    "21": "FTP File Upload/Download (Unencrypted)",
    "23": "Telnet Command Shell (Insecure)",
    "25": "SMTP Mail Delivery",
    "587": "Secure SMTP Mail Delivery",
    "110": "POP3 Mail Storage Retrieval",
    "993": "Secure IMAP Mail Service",
    "53": "DNS Server Query (Domain Lookup)",
    "123": "NTP Network Clock Synchronizer",
    "161": "SNMP Network Device Monitoring",
    "3389": "RDP Remote Desktop Management",
    "445": "SMB Windows File Sharing",
    "137": "NetBIOS Name Service",
    "138": "NetBIOS Datagram Service",
    "139": "NetBIOS Session Service",
    "1812": "RADIUS Authentication Server",
    "1813": "RADIUS Accounting Server"
  };

  let mainLabel = label;
  let subLabel = matches[portStr] || (label.toLowerCase().includes("tls") || label.toLowerCase().includes("https") ? "Encrypted Connection (SSL/TLS)" : "");

  if (appLabel && appLabel.includes("(") && domain && domain.startsWith("Port ")) {
    mainLabel = appLabel;
    subLabel = domain;
  }

  return {
    main: mainLabel || `Port ${port}`,
    sub: subLabel
  };
}

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
    { 
      header: "Dst IP", 
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="font-mono text-blue-400">{row.dst_ip}</span>
          <IpDetails ip={row.dst_ip} />
        </div>
      ) 
    },
    { header: "Dst Port", accessor: (row) => row.dst_port },
    { header: "Protocol", accessor: (row) => row.protocol },
    { 
      header: "App / Domain", 
      accessor: (row) => {
        const exp = explainAppOrPort(row.app_label, row.domain, row.dst_port);
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-white truncate max-w-[200px]" title={exp.main}>
              {exp.main}
            </span>
            {exp.sub && (
              <span className="text-[10px] text-slate-400 italic">
                {exp.sub}
              </span>
            )}
          </div>
        );
      }
    },
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

