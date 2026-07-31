"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Download, Upload, Server, Activity, ShieldAlert, Zap } from "lucide-react";
import { fmtBytes } from "@/lib/utils";

interface KPICardsProps {
  summary: {
    bandwidth_down: number;
    bandwidth_up: number;
    total_devices: number;
    active_flows: number;
    total_threats: number;
    total_events: number;
    download_speed?: number;
    upload_speed?: number;
    flow_speed?: number;
  } | null;
}

export function KPICards({ summary }: KPICardsProps) {
  // Use average speed over 24 hours (86400 seconds) to match standard BackOne analytics.
  const SECONDS_IN_24H = 86400;
  const downloadSpeedBits = summary ? (summary.bandwidth_down * 8) / SECONDS_IN_24H : 0;
  const uploadSpeedBits = summary ? (summary.bandwidth_up * 8) / SECONDS_IN_24H : 0;
  const flowsPerHour = summary ? Math.floor(summary.active_flows / 24) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-4">
      <Link href="/flows" className="block h-full focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-xl">
        <Card className="h-full flex flex-col justify-between group relative overflow-hidden bg-card/80 backdrop-blur-xl border-border/50 hover:bg-card/100 hover:border-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer animate-slide-up" style={{ animationDelay: '0ms' }}>
          <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Download className="h-10 w-10 sm:h-16 sm:w-16 text-blue-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2 relative z-10">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-blue-400 transition-colors">Download</CardTitle>
            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 relative z-10">
            <div className="text-base sm:text-xl md:text-[25px] font-bold text-white tracking-tight truncate">
              {summary ? fmtBytes(summary.bandwidth_down) : "0 B"}
            </div>
            {summary && (
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 flex items-center gap-1 group-hover:text-blue-400/80 transition-colors truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
                <span className="truncate">
                  Speed: {downloadSpeedBits >= 1e6 
                    ? `${(downloadSpeedBits / 1e6).toFixed(1)} Mbps` 
                    : downloadSpeedBits >= 1e3 
                    ? `${(downloadSpeedBits / 1e3).toFixed(1)} Kbps` 
                    : `${downloadSpeedBits.toFixed(1)} bps`}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>

      <Link href="/flows" className="block h-full focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-xl">
        <Card className="h-full flex flex-col justify-between group relative overflow-hidden bg-card/80 backdrop-blur-xl border-border/50 hover:bg-card/100 hover:border-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer animate-slide-up" style={{ animationDelay: '50ms' }}>
          <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Upload className="h-10 w-10 sm:h-16 sm:w-16 text-emerald-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2 relative z-10">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-emerald-400 transition-colors">Upload</CardTitle>
            <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 relative z-10">
            <div className="text-base sm:text-xl md:text-[25px] font-bold text-white tracking-tight truncate">
              {summary ? fmtBytes(summary.bandwidth_up) : "0 B"}
            </div>
            {summary && (
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 flex items-center gap-1 group-hover:text-emerald-400/80 transition-colors truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="truncate">
                  Speed: {uploadSpeedBits >= 1e6 
                    ? `${(uploadSpeedBits / 1e6).toFixed(1)} Mbps` 
                    : uploadSpeedBits >= 1e3 
                    ? `${(uploadSpeedBits / 1e3).toFixed(1)} Kbps` 
                    : `${uploadSpeedBits.toFixed(1)} bps`}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>

      <Link href="/devices" className="block h-full focus:outline-none focus:ring-2 focus:ring-orange-500/50 rounded-xl">
        <Card className="h-full flex flex-col justify-between group relative overflow-hidden bg-card/80 backdrop-blur-xl border-border/50 hover:bg-card/100 hover:border-orange-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Server className="h-10 w-10 sm:h-16 sm:w-16 text-orange-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2 relative z-10">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-orange-400 transition-colors">Devices</CardTitle>
            <Server className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 relative z-10">
            <div className="text-base sm:text-xl md:text-[25px] font-bold text-white tracking-tight truncate">
              {summary?.total_devices?.toLocaleString() || "0"}
            </div>
            <div className="text-[10px] sm:text-xs text-transparent select-none mt-1 pointer-events-none">&nbsp;</div>
          </CardContent>
        </Card>
      </Link>

      <Link href="/flows" className="block h-full focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded-xl">
        <Card className="h-full flex flex-col justify-between group relative overflow-hidden bg-card/80 backdrop-blur-xl border-border/50 hover:bg-card/100 hover:border-purple-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer animate-slide-up" style={{ animationDelay: '150ms' }}>
          <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="h-10 w-10 sm:h-16 sm:w-16 text-purple-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2 relative z-10">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-purple-400 transition-colors">Flows</CardTitle>
            <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 relative z-10">
            <div className="text-base sm:text-xl md:text-[25px] font-bold text-white tracking-tight truncate">
              {summary?.active_flows?.toLocaleString() || "0"}
            </div>
            {summary && flowsPerHour > 0 ? (
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 flex items-center gap-1 group-hover:text-purple-400/80 transition-colors truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse shrink-0" />
                <span className="truncate">Speed: {flowsPerHour.toLocaleString()} /hr</span>
              </div>
            ) : (
              <div className="text-[10px] sm:text-xs text-transparent select-none mt-1 pointer-events-none">&nbsp;</div>
            )}
          </CardContent>
        </Card>
      </Link>

      <Link href="/threats" className="block h-full focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded-xl">
        <Card className="h-full flex flex-col justify-between group relative overflow-hidden bg-red-50/90 dark:bg-card/80 backdrop-blur-xl border-red-200 dark:border-red-500/20 hover:bg-red-100 hover:dark:bg-card/100 hover:border-red-300 hover:dark:border-red-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="absolute inset-0 bg-red-500/10 dark:bg-red-500/5 pointer-events-none" />
          <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-20 dark:opacity-10 group-hover:opacity-30 dark:group-hover:opacity-20 transition-opacity text-red-600 dark:text-red-500">
            <ShieldAlert className="h-10 w-10 sm:h-16 sm:w-16" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2 relative z-10">
            <CardTitle className="text-xs sm:text-sm font-semibold text-red-700 dark:text-red-400 group-hover:text-red-800 dark:group-hover:text-red-300 transition-colors">Threats</CardTitle>
            <ShieldAlert className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 dark:text-red-500 animate-pulse shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 relative z-10">
            <div className="text-base sm:text-xl md:text-[25px] font-bold text-red-600 dark:text-red-500 tracking-tight truncate">
              {summary?.total_threats?.toLocaleString() || "0"}
            </div>
            <div className="text-[10px] sm:text-xs text-transparent select-none mt-1 pointer-events-none">&nbsp;</div>
          </CardContent>
        </Card>
      </Link>

      <Link href="/events" className="block h-full focus:outline-none focus:ring-2 focus:ring-yellow-500/50 rounded-xl">
        <Card className="h-full flex flex-col justify-between group relative overflow-hidden bg-card/80 backdrop-blur-xl border-border/50 hover:bg-card/100 hover:border-yellow-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer animate-slide-up" style={{ animationDelay: '250ms' }}>
          <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10 group-hover:opacity-20 transition-opacity text-yellow-500">
            <Zap className="h-10 w-10 sm:h-16 sm:w-16" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2 relative z-10">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-yellow-400 transition-colors">Events</CardTitle>
            <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 relative z-10">
            <div className="text-base sm:text-xl md:text-[25px] font-bold text-white tracking-tight truncate">
              {summary?.total_events?.toLocaleString() || "0"}
            </div>
            <div className="text-[10px] sm:text-xs text-transparent select-none mt-1 pointer-events-none">&nbsp;</div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
