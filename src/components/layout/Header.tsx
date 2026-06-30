"use client";

import { Bell, RefreshCw } from "lucide-react";

export function Header({
  lastUpdate = "—",
  isRefreshing = false,
  onRefresh = () => {},
}: {
  lastUpdate?: string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Site: {process.env.NEXT_PUBLIC_SITE_ID || "Unknown Site"}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-xs text-muted-foreground">
          Update: {lastUpdate}
        </div>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-secondary/80 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
        <button className="relative rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-white transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
        </button>
      </div>
    </header>
  );
}
