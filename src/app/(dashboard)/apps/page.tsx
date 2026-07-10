"use client";

import { useState, useEffect } from "react";
import { AppStat } from "@/lib/api";
import { useTopApps } from "@/lib/api-with-context";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { AppDetailModal } from "@/components/ui/AppDetailModal";
import { Loader2, ChevronRight, Globe } from "lucide-react";
import { fmtBytes, getAppFavicon } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

export default function AppsPage() {
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const { data, isLoading } = useTopApps(pageSize);
  const [selectedApp, setSelectedApp] = useState<AppStat | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const top5 = data.slice(0, 5);

  const columns: Column<AppStat>[] = [
    { header: "Last Seen", accessor: (row) => row.last_seen ? new Date(row.last_seen).toLocaleString() : '-' },
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
          <span className="group-hover:text-blue-300 transition-colors">{row.app_label}</span>
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
      accessor: (row) => <span className="text-green-500">{fmtBytes(row.upload)}</span>,
    },
    {
      header: "Total",
      accessor: (row) => <span className="font-medium text-white">{fmtBytes(row.download + row.upload)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            Applications
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Click any application to see which agents and devices are using it.
          </p>
        </div>
      </div>
      
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
                  tickFormatter={(value) => {
                    const gb = value / 1073741824;
                    const mb = value / 1048576;
                    return gb >= 1 ? `${gb.toFixed(1)}GB` : `${mb.toFixed(0)}MB`;
                  }}
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
          <CardTitle className="text-white">All Applications ({data.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={data}
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
          onClose={() => setSelectedApp(null)}
        />
      )}
    </div>
  );
}
