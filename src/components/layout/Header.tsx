"use client";

import { useState, useEffect } from "react";
import { Bell, RefreshCw } from "lucide-react";

const AGENT_LABELS: Record<string, string> = {
  '2F-TF-1D-GK': 'JRP Cibubur',
  '8A-V3-PB-85': 'IFG LT.18',
  'F6-2V-DT-8A': 'CPI Balaraja',
};

export function Header({
  lastUpdate = "—",
  isRefreshing = false,
  onRefresh = () => {},
}: {
  lastUpdate?: string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}) {
  const [user, setUser] = useState<{ role?: string; agent_uuid?: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Site: {process.env.NEXT_PUBLIC_SITE_ID || "Unknown Site"}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {user?.role === 'AGENT_VIEWER' && (
          <div className="flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/40 px-3 py-1 text-xs text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
            <span className="font-semibold">Agent:</span> {AGENT_LABELS[user.agent_uuid || ''] || user.agent_uuid} ({user.agent_uuid})
          </div>
        )}
        {user?.role === 'SUPER_ADMIN' && (
          <div className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/40 px-3 py-1 text-xs text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
            <span className="font-semibold">Admin:</span> All Agents
          </div>
        )}
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
