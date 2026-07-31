"use client";

import { useState, useEffect, useMemo } from "react";
import { useFlows, useFlowsOptions } from "@/lib/api-with-context";
import { DataTable } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2, Download, Search } from "lucide-react";
import { formatAppLabel } from "@/lib/utils";
import { DeviceDetailModal } from "@/components/ui/DeviceDetailModal";
import { UniversalFilters, useUniversalFilterState, FilterConfig } from "@/components/ui/UniversalFilters";
import { downloadCsv } from "@/components/ui/DataTableCsvHelper";
import { HelpTrigger } from "@/components/help/HelpTrigger";
import { getFlowColumns } from "./flowColumns";

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

  const columns = useMemo(() => getFlowColumns(setSelectedIp), []);

  const filterConfigs: FilterConfig[] = useMemo(() => {
    const opts = (key: string) => {
      if (!optionsData) return [];
      const mapping: Record<string, string[]> = {
        protocol: optionsData.protocols, src_ip: optionsData.srcIps, dst_ip: optionsData.dstIps,
        dst_port: optionsData.dstPorts, app_label: optionsData.apps, domain: optionsData.domains
      };
      return mapping[key] || [];
    };

    return [
      { id: "protocol", label: "Protocol", type: "select", value: filters.protocol, options: opts("protocol"), formatter: formatAppLabel },
      { id: "src_ip", label: "Source IP", type: "select", value: filters.src_ip, options: opts("src_ip") },
      { id: "dst_ip", label: "Dest IP", type: "select", value: filters.dst_ip, options: opts("dst_ip") },
      { id: "dst_port", label: "Dest Port", type: "select", value: filters.dst_port, options: opts("dst_port") },
      { id: "app", label: "App", type: "select", value: filters.app, options: opts("app_label"), formatter: formatAppLabel },
      { id: "domain", label: "Domain", type: "select", value: filters.domain, options: opts("domain") },
      { id: "sort_download", label: "Sort Download", type: "select", value: filters.sort_download, options: ["Descending", "Ascending"] },
      { id: "sort_upload", label: "Sort Upload", type: "select", value: filters.sort_upload, options: ["Descending", "Ascending"] },
    ];
  }, [optionsData, filters]);

  const minDate = useMemo(() => {
    return new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  }, []);

  const handleExport = () => {
    const headers = ["Flow ID", "Src IP", "Dst IP", "Dst Port", "Protocol", "App / Domain", "Download (bytes)", "Upload (bytes)"];
    const rows = [headers, ...flows.map(r => [r.flow_id || "", r.src_ip || "", r.dst_ip || "", r.dst_port ?? "", r.protocol || "", r.app_label || r.domain || `Port ${r.dst_port}`, r.bytes_download ?? 0, r.bytes_upload ?? 0])];
    downloadCsv(`flows-${new Date().toISOString().slice(0,10)}.csv`, rows);
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Flows
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
          </h2>
          <div className="shrink-0">
            <HelpTrigger pageId="flows" />
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-400">
          Real-time packet inspection and active network connection flows.
        </p>
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
