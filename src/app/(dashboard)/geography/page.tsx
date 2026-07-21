"use client";

import { useState, useEffect, useMemo } from "react";
import { useCountries } from "@/lib/api-with-context";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2 } from "lucide-react";
import { fmtBytes } from "@/lib/utils";
import { WorldMap } from "@/components/ui/WorldMap";
import { UniversalFilters, useUniversalFilterState, FilterConfig } from "@/components/ui/UniversalFilters";
import { HelpTrigger } from "@/components/help/HelpTrigger";

export default function GeographyPage() {
  const [mounted, setMounted] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const { data, isLoading } = useCountries(50); // fetch 50 countries

  const { 
    filters,
    handleFilterChange,
    handleReset, activeCount 
  } = useUniversalFilterState();

  const mapData = useMemo(() => {
    if (!data) return [];
    return data.map((row) => ({
      countryCode: row.country_code,
      value: row.download + row.upload,
      download: row.download,
      upload: row.upload,
      label: row.country_name,
    }));
  }, [data]);

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
    { id: "country_name", label: "Country", type: "select", value: filters.country_name, options: opts("country_name") },
    { id: "sort_download", label: "Sort Download", type: "select", value: filters.sort_download, options: ["Descending", "Ascending"] },
    { id: "sort_upload", label: "Sort Upload", type: "select", value: filters.sort_upload, options: ["Descending", "Ascending"] },
  ];

  const filteredData = all.filter((row: any) => {
    if (filters.country_name && filters.country_name !== "All" && row.country_name !== filters.country_name) return false;
    return true;
  });

  let processedData = [...filteredData];
  const sortUpload = filters.sort_upload || "All";
  const sortDownload = filters.sort_download || "All";
  
  if (sortUpload !== "All") {
    processedData.sort((a, b) => sortUpload === "Descending" ? b.upload - a.upload : a.upload - b.upload);
  } else if (sortDownload !== "All") {
    processedData.sort((a, b) => sortDownload === "Descending" ? b.download - a.download : a.download - b.download);
  }

  const columns: Column<typeof data[0]>[] = [
    { header: "#", accessor: (row, i) => i + 1 },
    { 
      header: "Country", 
      accessor: (row) => (
        <div className="flex items-center gap-2">
          {row.country_code && (
            <img 
              src={`https://flagcdn.com/w20/${row.country_code.toLowerCase()}.png`} 
              alt={row.country_code}
              className="w-5 h-auto rounded-sm"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <span>{row.country_name}</span>
        </div>
      )
    },
    { header: "Country Code", accessor: (row) => row.country_code },
    { 
      header: "Download", 
      accessor: (row) => <span className="text-blue-400">{fmtBytes(row.download)}</span> 
    },
    { 
      header: "Upload", 
      accessor: (row) => <span className="text-green-500">{fmtBytes(row.upload)}</span> 
    },
    { 
      header: "Total Data", 
      accessor: (row) => <span className="font-medium text-white">{fmtBytes(row.download + row.upload)}</span> 
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Geo Traffic
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
          </h2>
          <p className="text-muted-foreground mt-1">Geographic distribution of inbound and outbound traffic by country.</p>
        </div>
        <HelpTrigger pageId="geography" />
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
        showDateRange={false}
        activeFilterCount={activeCount}
        onReset={handleReset}
      />

      {showMap && (
        <Card className="bg-card/80 backdrop-blur-xl border-border/50 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4 mb-4">
            <CardTitle className="text-lg text-white">Heatmap Visualization</CardTitle>
            <button 
              onClick={() => setShowMap(false)}
              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              Close Heatmap
            </button>
          </CardHeader>
          <CardContent className="p-1 sm:p-4 pt-0">
            <WorldMap data={mapData} />
          </CardContent>
        </Card>
      )}

      <Card className="bg-card/80 backdrop-blur-xl border-border/50 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4 mb-4">
          <CardTitle className="text-lg text-white">Traffic by Country ({processedData.length})</CardTitle>
          {!showMap && (
            <button 
              onClick={() => setShowMap(true)} 
              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 rounded-lg transition-all shadow-[0_0_15px_rgba(59,130,246,0.15)] flex items-center gap-2 text-sm font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
              Load Geographic Heatmap
            </button>
          )}
        </CardHeader>
        <CardContent>
          <DataTable
            data={processedData}
            columns={columns}
            searchPlaceholder="Search by country name..."
            searchFilter={(row, query) => {
              const q = query.toLowerCase();
              return (row.country_name || "").toLowerCase().includes(q);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
