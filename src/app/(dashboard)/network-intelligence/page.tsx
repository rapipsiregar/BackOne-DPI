"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable, Column } from "@/components/ui/DataTable";
import { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { Activity, Loader2 } from "lucide-react";
import { AppCategoryStat } from "@/lib/api";
import { useAppCategories, useContinents } from "@/lib/api-with-context";
import { fmtBytes } from "@/lib/utils";
import { UniversalFilters, useUniversalFilterState, FilterConfig } from "@/components/ui/UniversalFilters";
import { CategoryDetailPanel } from "@/components/network/CategoryDetailPanel";
import { HelpTrigger } from "@/components/help/HelpTrigger";

const COLORS = ['#58a6ff', '#3fb950', '#f0883e', '#bc8cff', '#f85149'];

export default function NetworkIntelligencePage() {
  const [mounted, setMounted] = useState(false);
  const appCategories = useAppCategories();
  const continents = useContinents();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { 
    filters,
    handleFilterChange,
    handleReset, activeCount 
  } = useUniversalFilterState();

  useEffect(() => {
    setMounted(true);
    document.title = "Traffic Categories | BackOne - Deep Package Inspection";
  }, []);

  if (!mounted) return null;

  const allCategories = appCategories.data || [];

  const opts = (key: string) => {
    const raw = Array.from(new Set(allCategories.map((r: any) => String(r[key] || "")).filter(Boolean)));
    return raw.sort();
  };

  const filterConfigs: FilterConfig[] = [
    { id: "category_label", label: "Category", type: "select", value: filters.category_label, options: opts("category_label") },
    { id: "sort_download", label: "Sort Download", type: "select", value: filters.sort_download, options: ["Descending", "Ascending"] },
    { id: "sort_upload", label: "Sort Upload", type: "select", value: filters.sort_upload, options: ["Descending", "Ascending"] },
  ];

  const filteredData = allCategories.filter((row: any) => {
    if (filters.category_label && filters.category_label !== "All" && row.category_label !== filters.category_label) return false;
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

  const appCols: Column<AppCategoryStat>[] = [
    { header: "#", accessor: (row, i) => i + 1, className: "w-[10%] text-center" },
    { 
      header: "Category", 
      accessor: (row) => (
        <div title={row.category_label || '-'} className="font-semibold text-white truncate w-full block text-center cursor-help animate-pulse-subtle">
          <span className="border-b border-dashed border-white/30 pb-0.5">{row.category_label || '-'}</span>
        </div>
      ),
      className: "w-[35%] text-center"
    },
    { header: "Download", accessor: (row) => <span className="text-cyan-400">{fmtBytes(row.download)}</span>, className: "w-[18%] text-center" },
    { header: "Upload", accessor: (row) => <span className="text-green-400">{fmtBytes(row.upload)}</span>, className: "w-[18%] text-center" },
    { header: "Total", accessor: (row) => fmtBytes(row.total), className: "w-[19%] text-center" },
  ];

  const isLoading = appCategories.isLoading || continents.isLoading;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3 sm:justify-start sm:gap-4 w-full">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2 sm:gap-3 truncate">
              <span>Traffic Categories</span>
              {isLoading && <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-primary flex-shrink-0" />}
            </h2>
            {/* Mobile Actions: Inline next to Title */}
            <div className="flex items-center gap-1.5 flex-shrink-0 sm:hidden">
              <HelpTrigger pageId="network-intelligence" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-normal sm:leading-relaxed">Deep packet inspection analytics and geography.</p>
        </div>

        {/* Laptop/Tablet Actions: Floats on the right */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <HelpTrigger pageId="network-intelligence" />
        </div>
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

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column: App Categories List */}
        <Card className="bg-card/80 backdrop-blur-xl border-border/50 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <CardHeader className="border-b border-border/50 pb-4 mb-4">
            <CardTitle className="text-lg text-white">App Categories List</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable 
              data={processedData} 
              columns={appCols} 
              pageSize={50} 
              onRowClick={(row) => setSelectedCategory(row.category_label)}
            />
          </CardContent>
        </Card>

        {/* Right Column: Graphs */}
        <div className="flex flex-col gap-6">
          {/* App Categories Graph */}
          <Card className="bg-card/80 backdrop-blur-xl border-border/50 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <CardHeader className="border-b border-border/50 pb-4 mb-4">
              <CardTitle className="text-lg text-white">App Categories Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={processedData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="download"
                      nameKey="category_label"
                    >
                      {processedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9' }}
                      formatter={(val: any) => fmtBytes(val as number)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Continents Graph */}
          <Card className="bg-card/80 backdrop-blur-xl border-border/50 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <CardHeader className="border-b border-border/50 pb-4 mb-4">
              <CardTitle className="text-lg text-white">Continents (Download Volume)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={continents.data || []} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363d" horizontal={true} vertical={false} />
                    <XAxis type="number" stroke="#8b949e" tickFormatter={(v) => `${(v/1000000000).toFixed(1)}GB`} />
                    <YAxis dataKey="continent_name" type="category" stroke="#8b949e" fontSize={12} />
                    <RechartsTooltip 
                      cursor={{fill: '#21262d'}}
                      contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9' }}
                      formatter={(val: any) => fmtBytes(val as number)}
                    />
                    <Bar dataKey="download" fill="#58a6ff" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 border border-border rounded-md p-4 bg-secondary/30">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Most of your traffic is bound for {continents.data && continents.data.length > 0 ? continents.data[0].continent_name : "unknown destinations"}. Ensure your firewall rules are optimized for latency across trans-oceanic cables.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {selectedCategory && (
        <CategoryDetailPanel
          category={selectedCategory}
          onClose={() => setSelectedCategory(null)}
        />
      )}
    </div>
  );
}
