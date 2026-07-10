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

const COLORS = ['#58a6ff', '#3fb950', '#f0883e', '#bc8cff', '#f85149'];

export default function NetworkIntelligencePage() {
  const [mounted, setMounted] = useState(false);
  const appCategories = useAppCategories();
  const continents = useContinents();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const appCols: Column<AppCategoryStat>[] = [
    { header: "#", accessor: (row, i) => i + 1, className: "w-[60px] min-w-[60px] max-w-[60px]" },
    { 
      header: "Category", 
      accessor: (row) => (
        <div title={row.category_label || '-'} className="font-semibold text-white truncate w-full block text-center cursor-help">
          {row.category_label || '-'}
        </div>
      ),
      className: "w-[180px] min-w-[180px] max-w-[180px]"
    },
    { header: "Download", accessor: (row) => <span className="text-cyan-400">{fmtBytes(row.download)}</span>, className: "w-[120px] min-w-[120px] max-w-[120px]" },
    { header: "Upload", accessor: (row) => <span className="text-green-400">{fmtBytes(row.upload)}</span>, className: "w-[120px] min-w-[120px] max-w-[120px]" },
    { header: "Total", accessor: (row) => fmtBytes(row.total), className: "w-[120px] min-w-[120px] max-w-[120px]" },
  ];

  const isLoading = appCategories.isLoading || continents.isLoading;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Traffic Categories
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
          </h2>
          <p className="text-muted-foreground mt-1">Deep packet inspection analytics and geography.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          <Activity className="h-4 w-4" />
          <span>DPI Engine Active</span>
        </div>
      </div>
      

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column: App Categories List */}
        <Card className="bg-card/80 backdrop-blur-xl border-border/50 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <CardHeader className="border-b border-border/50 pb-4 mb-4">
            <CardTitle className="text-lg text-white">App Categories List</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable data={appCategories.data || []} columns={appCols} pageSize={50} />
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
                      data={appCategories.data || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="download"
                      nameKey="category_label"
                    >
                      {(appCategories.data || []).map((entry, index) => (
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
    </div>
  );
}
