"use client";

import { useState, useEffect } from "react";
import { TimestampCell } from "@/components/ui/TimestampCell";
import { useFlows, useFlowsOptions } from "@/lib/api-with-context";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2, Download, Search } from "lucide-react";
import { fmtBytes, formatAppLabel } from "@/lib/utils";
import { IpDetails } from "@/components/ui/IpDetails";
import { DeviceDetailModal } from "@/components/ui/DeviceDetailModal";
import { UniversalFilters, useUniversalFilterState, FilterConfig } from "@/components/ui/UniversalFilters";
import { explainAppOrPort } from "./explainFlow";
import { downloadCsv } from "@/components/ui/DataTableCsvHelper";
import { HelpTrigger } from "@/components/help/HelpTrigger";

export default function FlowsPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedIp, setSelectedIp] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [ipSearch, setIpSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const { 
    filters, dateFrom, dateTo, 
    handleFilterChange, setDateFrom, setDateTo, 
    handleReset, activeCount 
  } = useUniversalFilterState();

  // Debounce search query to prevent database query spamming
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(ipSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [ipSearch]);

  // Reset page to 1 when filters, date picker, or search text changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, dateFrom, dateTo, debouncedSearch]);

  const { data: optionsData } = useFlowsOptions();
  const { data: flows = [], total = 0, isLoading } = useFlows(currentPage, 50, {
    ...filters,
    dateFrom,
    dateTo,
    search: debouncedSearch
  });

  useEffect(() => {
    setMounted(true);
    document.title = "Flows | BackOne - Deep Package Inspection";
  }, []);

  if (!mounted) return null;

  const opts = (key: string) => {
    if (!optionsData) return [];
    const mapping: Record<string, string[]> = {
      protocol: optionsData.protocols, src_ip: optionsData.srcIps, dst_ip: optionsData.dstIps,
      dst_port: optionsData.dstPorts, app_label: optionsData.apps, domain: optionsData.domains
    };
    return mapping[key] || [];
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

  const minDate = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const handleExport = () => {
    const headers = ["Flow ID", "Src IP", "Dst IP", "Dst Port", "Protocol", "App / Domain", "Download (bytes)", "Upload (bytes)"];
    const rows = [headers, ...flows.map(r => [r.flow_id || "", r.src_ip || "", r.dst_ip || "", r.dst_port ?? "", r.protocol || "", r.app_label || r.domain || `Port ${r.dst_port}`, r.bytes_download ?? 0, r.bytes_upload ?? 0])];
    downloadCsv(`flows-${new Date().toISOString().slice(0,10)}.csv`, rows);
  };

  const columns: Column<any>[] = [
    { 
      header: "Last Seen", 
      accessor: (row) => (
        <TimestampCell 
          timestamp={row.last_seen} 
          firstSeen={row.first_seen} 
          showActiveStatus={true} 
        />
      ),
      className: "w-[14%] text-center",
      tooltip: (row) => new Date(row.last_seen).toLocaleString()
    },
    { 
      header: "#", 
      accessor: (row, i) => i + 1,
      className: "w-[4%] text-center"
    },
    { 
      header: "Flow ID", 
      accessor: (row) => row.flow_id,
      className: "w-[11%] text-center font-mono text-xs truncate"
    },
    { 
      header: "Src IP", 
      accessor: (row) => (
        <div className="flex flex-col items-center justify-center text-center">
          <button
            onClick={() => setSelectedIp(row.src_ip)}
            className="text-blue-400 hover:text-blue-300 hover:underline font-mono text-center focus:outline-none truncate w-full"
          >
            {row.src_ip}
          </button>
          {row.src_label && (
            <span className="text-[10px] text-cyan-400 font-semibold tracking-wide mt-0.5 truncate w-full block">
              {row.src_label}
            </span>
          )}
        </div>
      ),
      className: "w-[11%] text-center",
      tooltip: (row) => row.src_label ? `${row.src_ip} (${row.src_label})` : row.src_ip
    },
    { 
      header: "Dst IP", 
      accessor: (row) => (
        <div className="flex flex-col items-center justify-center">
          <button
            onClick={() => setSelectedIp(row.dst_ip)}
            className="text-blue-400 hover:text-blue-300 hover:underline font-mono text-center focus:outline-none truncate w-full"
          >
            {row.dst_ip}
          </button>
          <IpDetails ip={row.dst_ip} />
        </div>
      ),
      className: "w-[13%] text-center",
      tooltip: (row) => row.dst_ip
    },
    { 
      header: "Dst Port", 
      accessor: (row) => row.dst_port,
      className: "w-[7%] text-center font-mono text-xs"
    },
    { 
      header: "Protocol", 
      accessor: (row) => row.protocol,
      className: "w-[7%] text-center text-xs"
    },
    { 
      header: "App / Domain", 
      accessor: (row) => {
        const exp = explainAppOrPort(row.app_label, row.domain, row.dst_port);
        return (
          <div className="flex flex-col items-center justify-center">
            <span className="font-semibold text-white truncate max-w-[200px] text-center" title={exp.main}>
              {exp.main}
            </span>
            {exp.sub && (
              <span className="text-[10px] text-slate-400 italic text-center truncate max-w-[200px]">
                {exp.sub}
              </span>
            )}
          </div>
        );
      },
      className: "w-[18%] text-center",
      tooltip: (row) => {
        const exp = explainAppOrPort(row.app_label, row.domain, row.dst_port);
        return exp.sub ? `${exp.main} (${exp.sub})` : exp.main;
      }
    },
    { 
      header: "Download", 
      accessor: (row) => <span className="text-blue-400">{fmtBytes(row.bytes_download)}</span>,
      className: "w-[8%] text-center",
      tooltip: (row) => `${fmtBytes(row.bytes_download)} (${(row.bytes_download || 0).toLocaleString()} bytes)`
    },
    { 
      header: "Upload", 
      accessor: (row) => <span className="text-green-500">{fmtBytes(row.bytes_upload)}</span>,
      className: "w-[7%] text-center",
      tooltip: (row) => `${fmtBytes(row.bytes_upload)} (${(row.bytes_upload || 0).toLocaleString()} bytes)`
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          Flows
          {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
        </h2>
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <CardTitle className="text-white">Active Flows ({total.toLocaleString()})</CardTitle>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input
                type="text"
                placeholder="Search IP (source or dest)..."
                value={ipSearch}
                onChange={(e) => setIpSearch(e.target.value)}
                className="w-[240px] rounded-lg border border-border bg-card/30 backdrop-blur-sm pl-9 pr-4 py-1.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-card/50 transition-all shadow-sm"
              />
            </div>
          </div>
          <button
            onClick={handleExport}
            title="Export current page flows to CSV"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/70 hover:text-emerald-300 transition-all shadow-sm whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Export CSV ({total.toLocaleString()})
          </button>
        </CardHeader>
        <CardContent>
          <DataTable
            data={flows}
            columns={columns}
            serverSide={true}
            totalCount={total}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {selectedIp && (
        <DeviceDetailModal ip={selectedIp} onClose={() => setSelectedIp(null)} />
      )}
    </div>
  );
}
