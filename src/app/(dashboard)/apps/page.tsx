"use client";

import { useState, useEffect } from "react";
import { TimestampCell } from "@/components/ui/TimestampCell";
import { AppStat } from "@/lib/api";
import { useTopApps } from "@/lib/api-with-context";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { AppDetailModal } from "@/components/ui/AppDetailModal";
import { Loader2, ChevronRight, Globe } from "lucide-react";
import { UniversalFilters, useUniversalFilterState, FilterConfig } from "@/components/ui/UniversalFilters";
import { fmtBytes, getAppFavicon, formatAppLabel } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { HelpTrigger } from "@/components/help/HelpTrigger";
import { getViewAsStatusSync } from "@/lib/admin-api";

export default function AppsPage() {
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const [selectedApp, setSelectedApp] = useState<AppStat | null>(null);

  const { 
    filters, dateFrom, dateTo, 
    handleFilterChange, setDateFrom, setDateTo, 
    handleReset, activeCount 
  } = useUniversalFilterState();

  // Pass dateFrom/dateTo so the backend filters by the exact calendar date range
  const { data, isLoading } = useTopApps(pageSize, dateFrom, dateTo);


  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const all = data || [];

  const opts = (key: string) => {
    const raw = Array.from(new Set(all.map((r: any) => String(r[key] || "")).filter(Boolean)));
    return raw.sort();
  };

  const filterConfigs: FilterConfig[] = [
    { id: "app_label", label: "Application", type: "select", value: filters.app_label, options: opts("app_label"), formatter: formatAppLabel },
    { id: "category", label: "Category", type: "select", value: filters.category, options: opts("category") },
    { id: "sort_download", label: "Sort Download", type: "select", value: filters.sort_download, options: ["Descending", "Ascending"] },
    { id: "sort_upload", label: "Sort Upload", type: "select", value: filters.sort_upload, options: ["Descending", "Ascending"] },
    { id: "sort_total", label: "Sort Total", type: "select", value: filters.sort_total, options: ["Descending", "Ascending"] },
  ];

  const filteredData = all.filter((row: any) => {
    if (filters.app_label && filters.app_label !== "All" && row.app_label !== filters.app_label) return false;
    if (filters.category && filters.category !== "All" && row.category !== filters.category) return false;
    // Date filtering is handled server-side via date_from/date_to params.
    // AppStat records do not have a last_seen field, so client-side date
    // filtering is intentionally omitted here.
    return true;
  });


  let processedData = [...filteredData];
  const sortUpload = filters.sort_upload || "All";
  const sortDownload = filters.sort_download || "All";
  const sortTotal = filters.sort_total || "All";
  
  if (sortTotal !== "All") {
    processedData.sort((a, b) => sortTotal === "Descending" ? ((b.upload ?? 0) + (b.download ?? 0)) - ((a.upload ?? 0) + (a.download ?? 0)) : ((a.upload ?? 0) + (a.download ?? 0)) - ((b.upload ?? 0) + (b.download ?? 0)));
  } else if (sortUpload !== "All") {
    processedData.sort((a, b) => sortUpload === "Descending" ? (b.upload ?? 0) - (a.upload ?? 0) : (a.upload ?? 0) - (b.upload ?? 0));
  } else if (sortDownload !== "All") {
    processedData.sort((a, b) => sortDownload === "Descending" ? (b.download ?? 0) - (a.download ?? 0) : (a.download ?? 0) - (b.download ?? 0));
  }

  // Use the data retention window (7 days) as the minimum selectable date.
  // Dynamic computation from loaded data causes a circular dependency where
  // the sidebar time filter (e.g., Last 24h) restricts the date picker range.
  const minDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const top5 = processedData.slice(0, 5);

  const columns: Column<AppStat>[] = [
    { 
      header: "Last Seen", 
      accessor: (row) => <TimestampCell timestamp={row.last_seen} showActiveStatus={true} />
    },
    { header: "#", accessor: (row, i) => i + 1 },
    {
      header: "Application",
      accessor: (row) => (
        <button
          onClick={() => setSelectedApp(row)}
          className="flex items-center gap-2 group text-left"
          title="Click to view app details"
        >
          {(() => {
            const fav = row.favicon || getAppFavicon(row.app_label);
            return fav ? (
              <img src={fav} alt={row.app_label} className="w-5 h-5 rounded-sm bg-white p-0.5 flex-shrink-0" />
            ) : (
              <div className="w-5 h-5 rounded bg-blue-500/10 border border-blue-500/25 flex items-center justify-center flex-shrink-0">
                <Globe className="w-3 h-3 text-blue-400" />
              </div>
            );
          })()}
          <span className="group-hover:text-blue-300 transition-colors">{formatAppLabel(row.app_label)}</span>
          <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-blue-400 transition-colors" />
        </button>
      ),
    },
    { header: "Category", accessor: (row) => row.category || "-" },
    {
      header: "Download",
      accessor: (row) => <span className="text-blue-400">{fmtBytes(row.download)}</span>,
    },
    {
      header: "Upload",
      accessor: (row) => <span className="text-green-500">{fmtBytes(row.upload)}</span>
    },
    {
      header: "Total",
      accessor: (row) => <span className="font-medium text-white">{fmtBytes(row.download + row.upload)}</span>
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            Applications
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Click any application to see which agents and devices are using it.
          </p>
        </div>
        <HelpTrigger pageId="apps" />
      </div>
      
      <UniversalFilters
        filters={filterConfigs}
        onChange={(id, val) => {
          if (id === 'sort_download') {
            handleFilterChange('sort_download', val);
            handleFilterChange('sort_upload', 'All');
            handleFilterChange('sort_total', 'All');
          } else if (id === 'sort_upload') {
            handleFilterChange('sort_upload', val);
            handleFilterChange('sort_download', 'All');
            handleFilterChange('sort_total', 'All');
          } else if (id === 'sort_total') {
            handleFilterChange('sort_total', val);
            handleFilterChange('sort_download', 'All');
            handleFilterChange('sort_upload', 'All');
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
          <CardTitle className="text-white">Top 5 Applications by Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top5} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                <XAxis dataKey="app_label" stroke="#8b949e" tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#8b949e"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => fmtBytes(value)}
                />
                <RechartsTooltip
                  cursor={{ fill: "#21262d" }}
                  contentStyle={{ backgroundColor: "#161b22", borderColor: "#30363d", color: "#c9d1d9" }}
                  formatter={(value: any) => [fmtBytes(value as number), "Volume"]}
                />
                <Bar dataKey="download" name="Download" fill="#58a6ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="upload" name="Upload" fill="#3fb950" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-white">All Applications ({processedData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={processedData}
            columns={columns}
            searchPlaceholder="Search by application or category..."
            searchFilter={(row, query) => {
              const q = query.toLowerCase();
              return (
                (row.app_label || "").toLowerCase().includes(q) ||
                (row.category || "").toLowerCase().includes(q)
              );
            }}
          />
        </CardContent>
      </Card>

      {/* App Detail Modal */}
      {selectedApp && (
        <AppDetailModal
          appLabel={selectedApp.app_label}
          favicon={selectedApp.favicon}
          category={selectedApp.category}
          agentUuid={getViewAsStatusSync().agent_uuid}
          onClose={() => setSelectedApp(null)}
        />
      )}
    </div>
  );
}
