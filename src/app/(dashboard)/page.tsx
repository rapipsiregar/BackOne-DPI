"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Activity, Download, Upload, ShieldAlert, Zap, Server, Loader2 } from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useState, useEffect, useMemo } from "react";
import { useDashboardSummary, useTimeline, useTopApps, useTopProtocols, useCountries } from "@/lib/api";
import { fmtBytes } from "@/lib/utils";
import { GlobeMap } from "@/components/ui/GlobeMap";
import Link from "next/link";

const COLORS = ['#58a6ff', '#3fb950', '#f0883e', '#bc8cff', '#f85149'];

export default function SummaryPage() {
  const [mounted, setMounted] = useState(false);
  const summary = useDashboardSummary();
  const timeline = useTimeline(24);
  const topApps = useTopApps(7);
  const topProtocols = useTopProtocols();
  const countries = useCountries(20);

  const mapData = useMemo(() => {
    if (!countries.data) return [];
    return countries.data.map((row) => ({
      countryCode: row.country_code,
      value: row.download + row.upload,
      download: row.download,
      upload: row.upload,
      label: row.country_name,
    }));
  }, [countries.data]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isLoading = summary.isLoading || timeline.isLoading || topApps.isLoading || topProtocols.isLoading;

  const downloadSpeedBits = summary.data?.download_speed ? summary.data.download_speed * 8 : 0;
  const uploadSpeedBits = summary.data?.upload_speed ? summary.data.upload_speed * 8 : 0;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Summary Overview
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
          </h2>
          <p className="text-muted-foreground mt-1">Real-time network traffic and intelligence summary.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Link href="/flows" className="block focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-xl">
          <Card className="group relative overflow-hidden bg-card/80 backdrop-blur-xl border-border/50 hover:bg-card/100 hover:border-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer animate-slide-up" style={{ animationDelay: '0ms' }}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Download className="h-16 w-16 text-blue-500" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-blue-400 transition-colors">Download</CardTitle>
              <Download className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-white tracking-tight">
                {summary.data ? fmtBytes(summary.data.bandwidth_down) : "0 B"}
              </div>
              {summary.data?.download_speed !== undefined && summary.data.download_speed > 0 && (
                <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1 group-hover:text-blue-400/80 transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Speed: {downloadSpeedBits >= 1e6 
                    ? `${(downloadSpeedBits / 1e6).toFixed(1)} Mbps` 
                    : downloadSpeedBits >= 1e3 
                    ? `${(downloadSpeedBits / 1e3).toFixed(1)} Kbps` 
                    : `${downloadSpeedBits} bps`}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/flows" className="block focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-xl">
          <Card className="group relative overflow-hidden bg-card/80 backdrop-blur-xl border-border/50 hover:bg-card/100 hover:border-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer animate-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Upload className="h-16 w-16 text-emerald-500" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-emerald-400 transition-colors">Upload</CardTitle>
              <Upload className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-white tracking-tight">
                {summary.data ? fmtBytes(summary.data.bandwidth_up) : "0 B"}
              </div>
              {summary.data?.upload_speed !== undefined && summary.data.upload_speed > 0 && (
                <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1 group-hover:text-emerald-400/80 transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Speed: {uploadSpeedBits >= 1e6 
                    ? `${(uploadSpeedBits / 1e6).toFixed(1)} Mbps` 
                    : uploadSpeedBits >= 1e3 
                    ? `${(uploadSpeedBits / 1e3).toFixed(1)} Kbps` 
                    : `${uploadSpeedBits} bps`}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/devices" className="block focus:outline-none focus:ring-2 focus:ring-orange-500/50 rounded-xl">
          <Card className="group relative overflow-hidden bg-card/80 backdrop-blur-xl border-border/50 hover:bg-card/100 hover:border-orange-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Server className="h-16 w-16 text-orange-500" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-orange-400 transition-colors">Devices</CardTitle>
              <Server className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-white tracking-tight">
                {summary.data?.total_devices?.toLocaleString() || "0"}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/flows" className="block focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded-xl">
          <Card className="group relative overflow-hidden bg-card/80 backdrop-blur-xl border-border/50 hover:bg-card/100 hover:border-purple-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer animate-slide-up" style={{ animationDelay: '150ms' }}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity className="h-16 w-16 text-purple-500" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-purple-400 transition-colors">Flows</CardTitle>
              <Activity className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-white tracking-tight">
                {summary.data?.active_flows?.toLocaleString() || "0"}
              </div>
              {summary.data?.flow_speed !== undefined && summary.data.flow_speed > 0 && (
                <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1 group-hover:text-purple-400/80 transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                  Speed: {summary.data.flow_speed.toLocaleString()} /hr
                </div>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/threats" className="block focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded-xl">
          <Card className="group relative overflow-hidden bg-red-50/90 dark:bg-card/80 backdrop-blur-xl border-red-200 dark:border-red-500/20 hover:bg-red-100 hover:dark:bg-card/100 hover:border-red-300 hover:dark:border-red-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="absolute inset-0 bg-red-500/10 dark:bg-red-500/5 pointer-events-none" />
            <div className="absolute top-0 right-0 p-4 opacity-20 dark:opacity-10 group-hover:opacity-30 dark:group-hover:opacity-20 transition-opacity text-red-600 dark:text-red-500">
              <ShieldAlert className="h-16 w-16" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-semibold text-red-700 dark:text-red-400 group-hover:text-red-800 dark:group-hover:text-red-300 transition-colors">Threats</CardTitle>
              <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-500 animate-pulse" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-red-600 dark:text-red-500 tracking-tight">
                {summary.data?.total_threats?.toLocaleString() || "0"}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/events" className="block focus:outline-none focus:ring-2 focus:ring-yellow-500/50 rounded-xl">
          <Card className="group relative overflow-hidden bg-card/80 backdrop-blur-xl border-border/50 hover:bg-card/100 hover:border-yellow-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer animate-slide-up" style={{ animationDelay: '250ms' }}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-yellow-500">
              <Zap className="h-16 w-16" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-yellow-400 transition-colors">Events</CardTitle>
              <Zap className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-white tracking-tight">
                {summary.data?.total_events?.toLocaleString() || "0"}
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 animate-slide-up" style={{ animationDelay: '300ms' }}>
        {/* Global Connections Map (Replaces Timeline) */}
        <div className="col-span-4 relative flex items-center justify-center">
          <GlobeMap data={mapData} />
        </div>

        {/* Top Apps & Protocols */}
        <div className="col-span-3 space-y-6">
          <Card className="bg-card/80 backdrop-blur-xl border-border/50 flex-1">
            <CardHeader>
              <CardTitle className="text-lg text-white">Top Apps (Download)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[150px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topApps.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="app_label" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} tickMargin={5} />
                    <YAxis 
                      stroke="#a1a1aa" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => {
                        const mb = value / 1048576;
                        return `${mb.toFixed(0)}M`;
                      }}
                    />
                    <RechartsTooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{ 
                        backgroundColor: 'rgba(24, 24, 27, 0.9)', 
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)', 
                        borderRadius: '8px',
                        color: '#fafafa',
                      }}
                      itemStyle={{ color: '#fafafa', fontSize: '13px', fontWeight: 500 }}
                      formatter={(value: any) => [fmtBytes(value as number), 'Download']}
                    />
                    <Bar dataKey="download" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-xl border-border/50 flex-1">
            <CardHeader>
              <CardTitle className="text-lg text-white">Top Protocols</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[150px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topProtocols.data}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="download"
                      nameKey="protocol_label"
                      stroke="none"
                    >
                      {topProtocols.data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity outline-none" />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(24, 24, 27, 0.9)', 
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)', 
                        borderRadius: '8px',
                        color: '#fafafa'
                      }}
                      itemStyle={{ color: '#fafafa', fontSize: '13px', fontWeight: 500 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Custom Legend */}
                <div className="flex flex-col justify-center ml-2 space-y-3">
                  {topProtocols.data.slice(0, 5).map((entry, index) => (
                    <div key={`${entry.protocol_label}-${index}`} className="flex items-center text-sm text-muted-foreground whitespace-nowrap group cursor-default">
                      <div className="w-3.5 h-3.5 rounded-full mr-3 shrink-0 shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="truncate max-w-[100px] group-hover:text-white transition-colors">{entry.protocol_label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>


    </div>
  );
}
