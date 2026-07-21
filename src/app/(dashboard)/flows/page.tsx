"use client";

import { useState, useEffect } from "react";
import { TimestampCell } from "@/components/ui/TimestampCell";
import { useFlows } from "@/lib/api-with-context";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2 } from "lucide-react";
import { fmtBytes, formatAppLabel } from "@/lib/utils";
import { IpDetails } from "@/components/ui/IpDetails";
import { DeviceDetailModal } from "@/components/ui/DeviceDetailModal";
import { UniversalFilters, useUniversalFilterState, FilterConfig } from "@/components/ui/UniversalFilters";
import { HelpTrigger } from "@/components/help/HelpTrigger";

function explainAppOrPort(appLabel: string | null, domain: string | null, port: number) {
  const label = appLabel || domain || "";
  const portStr = String(port);
  
  const matches: Record<string, string> = {
    "1433": "MSSQL Database Server",
    "1434": "MSSQL Monitor Server",
    "3306": "MySQL/MariaDB Database Server",
    "5432": "PostgreSQL Database Server",
    "1521": "Oracle Database Server",
    "27017": "Database Server",
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
  const [selectedIp, setSelectedIp] = useState<string | null>(null);
  const { data, isLoading } = useFlows();
  
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

  // Extract unique options
  const opts = (key: string) => {
    const raw = Array.from(new Set(all.map((r: any) => String(r[key] || "")).filter(Boolean)));
    return raw.sort();
  };

  const filterConfigs: FilterConfig[] = [
    { id: "protocol", label: "Protocol", type: "select", value: filters.protocol, options: opts("protocol"), formatter: formatAppLabel },
    { id: "src_ip", label: "Source IP", type: "select", value: filters.src_ip, options: opts("src_ip") },
    { id: "dst_ip", label: "Dest IP", type: "select", value: filters.dst_ip, options: opts("dst_ip") },
    { id: "dst_port", label: "Dest Port", type: "select", value: filters.dst_port, options: opts("dst_port") },
    { id: "app", label: "App", type: "select", value: filters.app, options: opts("app_label"), formatter: formatAppLabel },
    { id: "domain", label: "Domain", type: "select", value: filters.domain, options: opts("domain") },
    { id: "sort_download", label: "Sort Download", type: "select", value: filters.sort_download, options: ["Descending", "Ascending"] },
    { id: "sort_upload", label: "Sort Upload", type: "select", value: filters.sort_upload, options: ["Descending", "Ascending"] },
  ];

  const filteredData = all.filter((row: any) => {
    if (filters.protocol && filters.protocol !== "All" && row.protocol !== filters.protocol) return false;
    if (filters.src_ip && filters.src_ip !== "All" && row.src_ip !== filters.src_ip) return false;
    if (filters.dst_ip && filters.dst_ip !== "All" && row.dst_ip !== filters.dst_ip) return false;
    if (filters.dst_port && filters.dst_port !== "All" && String(row.dst_port) !== filters.dst_port) return false;
    if (filters.app && filters.app !== "All" && row.app_label !== filters.app) return false;
    if (filters.domain && filters.domain !== "All" && row.domain !== filters.domain) return false;
    
    if (dateFrom || dateTo) {
      const d = row.last_seen ? new Date(row.last_seen).toISOString().slice(0, 10) : "";
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
    }
    
    return true;
  });

  let processedData = [...filteredData];
  const sortUpload = filters.sort_upload || "All";
  const sortDownload = filters.sort_download || "All";
  
  if (sortUpload !== "All") {
    processedData.sort((a, b) => sortUpload === "Descending" ? (b.bytes_upload ?? 0) - (a.bytes_upload ?? 0) : (a.bytes_upload ?? 0) - (b.bytes_upload ?? 0));
  } else if (sortDownload !== "All") {
    processedData.sort((a, b) => sortDownload === "Descending" ? (b.bytes_download ?? 0) - (a.bytes_download ?? 0) : (a.bytes_download ?? 0) - (b.bytes_download ?? 0));
  } else {
    processedData.sort((a, b) => {
      const timeA = a.last_seen ? new Date(a.last_seen).getTime() : 0;
      const timeB = b.last_seen ? new Date(b.last_seen).getTime() : 0;
      return timeB - timeA;
    });
  }

  const minTime = all.reduce((min: number, r: any) => {
    if (r.last_seen) {
      const time = new Date(r.last_seen).getTime();
      if (isFinite(time) && time < min) return time;
    }
    return min;
  }, Infinity);
  const minDate = minTime !== Infinity ? new Date(minTime).toISOString().slice(0, 10) : "2024-01-01";

  const columns: Column<typeof data[0]>[] = [
    { 
      header: "Last Seen", 
      accessor: (row) => (
        <TimestampCell 
          timestamp={row.last_seen} 
          firstSeen={row.first_seen} 
          showActiveStatus={true} 
        />
      ),
      className: "w-[120px]"
    },
    { header: "#", accessor: (row, i) => i + 1 },
    { header: "Flow ID", accessor: (row) => row.flow_id },
    { 
      header: "Src IP", 
      accessor: (row) => (
        <button
          onClick={() => setSelectedIp(row.src_ip)}
          className="text-blue-400 hover:text-blue-300 hover:underline font-mono text-left focus:outline-none"
        >
          {row.src_ip}
        </button>
      ) 
    },
    { 
      header: "Dst IP", 
      accessor: (row) => (
        <div className="flex flex-col items-start">
          <button
            onClick={() => setSelectedIp(row.dst_ip)}
            className="text-blue-400 hover:text-blue-300 hover:underline font-mono text-left focus:outline-none"
          >
            {row.dst_ip}
          </button>
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
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Active Flows
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
          </h2>
          <p className="text-muted-foreground mt-1">Real-time IP connection flows and protocol analysis.</p>
        </div>
        <HelpTrigger pageId="flows" />
      </div>

      <UniversalFilters
        filters={filterConfigs}
        onChange={(id, val) => {
          if (id === 'sort_download') {
            handleFilterChange('sort_download', val);
            handleFilterChange('sort_upload', 'All');
          } else if (id === 'sort_upload') {
            handleFilterChange('sort_upload', val);
            handleFilterChange('sort_download', 'All');
          } else {
            handleFilterChange(id, val);
          }
        }}
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
          <CardTitle className="text-white">Active Flows ({processedData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={processedData}
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
            csvExport={{
              filename: `flows-${new Date().toISOString().slice(0,10)}.csv`,
              headers: ["Flow ID", "Src IP", "Dst IP", "Dst Port", "Protocol", "App / Domain", "Download (bytes)", "Upload (bytes)"],
              rowSerializer: (row) => [
                row.flow_id || "",
                row.src_ip || "",
                row.dst_ip || "",
                row.dst_port ?? "",
                row.protocol || "",
                row.app_label || row.domain || `Port ${row.dst_port}`,
                row.bytes_download ?? 0,
                row.bytes_upload ?? 0,
              ],
            }}
          />
        </CardContent>
      </Card>

      {selectedIp && (
        <DeviceDetailModal ip={selectedIp} onClose={() => setSelectedIp(null)} />
      )}
    </div>
  );
}
