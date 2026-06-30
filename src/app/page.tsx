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
import { useState, useEffect } from "react";
import { useDashboardSummary, useTimeline, useTopApps, useTopProtocols } from "@/lib/api";
import { fmtBytes } from "@/lib/utils";

const COLORS = ['#58a6ff', '#3fb950', '#f0883e', '#bc8cff', '#f85149'];

export default function SummaryPage() {
  const [mounted, setMounted] = useState(false);
  const summary = useDashboardSummary();
  const timeline = useTimeline(24);
  const topApps = useTopApps(7);
  const topProtocols = useTopProtocols();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isLoading = summary.isLoading || timeline.isLoading || topApps.isLoading || topProtocols.isLoading;

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
        <Card className="group relative overflow-hidden bg-card/80 backdrop-blur-xl border-border/50 hover:bg-card/100 hover:border-primary/30 transition-all duration-300 cursor-default animate-slide-up" style={{ animationDelay: '0ms' }}>
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
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden bg-card/80 backdrop-blur-xl border-border/50 hover:bg-card/100 hover:border-emerald-500/30 transition-all duration-300 cursor-default animate-slide-up" style={{ animationDelay: '50ms' }}>
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
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden bg-card/80 backdrop-blur-xl border-border/50 hover:bg-card/100 hover:border-orange-500/30 transition-all duration-300 cursor-default animate-slide-up" style={{ animationDelay: '100ms' }}>
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
        <Card className="group relative overflow-hidden bg-card/80 backdrop-blur-xl border-border/50 hover:bg-card/100 hover:border-purple-500/30 transition-all duration-300 cursor-default animate-slide-up" style={{ animationDelay: '150ms' }}>
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
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden bg-card/80 backdrop-blur-xl border-red-500/20 hover:bg-card/100 hover:border-red-500/50 transition-all duration-300 cursor-default animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-red-500">
            <ShieldAlert className="h-16 w-16" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-red-400 group-hover:text-red-300 transition-colors">Threats</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500 animate-pulse" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-red-500 tracking-tight">
              {summary.data?.total_threats?.toLocaleString() || "0"}
            </div>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden bg-card/80 backdrop-blur-xl border-border/50 hover:bg-card/100 hover:border-yellow-500/30 transition-all duration-300 cursor-default animate-slide-up" style={{ animationDelay: '250ms' }}>
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
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 animate-slide-up" style={{ animationDelay: '300ms' }}>
        {/* Timeline Chart */}
        <Card className="col-span-4 bg-card/80 backdrop-blur-xl border-border/50">
          <CardHeader>
            <CardTitle className="text-lg text-white">Bandwidth Timeline</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline.data} margin={{ top: 15, right: 20, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorDownload" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorUpload" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="fetched_at" 
                    stroke="#a1a1aa" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(val) => {
                      try {
                        return new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      } catch (e) {
                        return val;
                      }
                    }}
                  />
                  <YAxis 
                    stroke="#a1a1aa" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => {
                      if (val === 0) return '0 B';
                      const k = 1024;
                      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
                      const i = Math.floor(Math.log(val) / Math.log(k));
                      return parseFloat((val / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
                    }} 
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(24, 24, 27, 0.9)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)', 
                      borderRadius: '8px',
                      color: '#fafafa',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                    }}
                    itemStyle={{ color: '#fafafa', fontSize: '13px', fontWeight: 500 }}
                    labelFormatter={(label) => {
                      try {
                        return new Date(label).toLocaleString();
                      } catch (e) {
                        return label;
                      }
                    }}
                    formatter={(value: any, name: any) => [fmtBytes(value as number), name === 'total_download' ? 'Download' : 'Upload']}
                  />
                  <Area type="monotone" dataKey="total_download" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorDownload)" activeDot={{ r: 6, fill: "#3b82f6", stroke: "#18181b", strokeWidth: 2 }} />
                  <Area type="monotone" dataKey="total_upload" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorUpload)" activeDot={{ r: 6, fill: "#10b981", stroke: "#18181b", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

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
