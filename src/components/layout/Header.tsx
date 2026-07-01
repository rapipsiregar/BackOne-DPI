"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Bell, RefreshCw, Calendar, AlertTriangle, Info, Clock, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useThreats, useEvents } from "@/lib/api";

const AGENT_LABELS: Record<string, string> = {
  '2F-TF-1D-GK': 'JRP Cibubur',
  '8A-V3-PB-85': 'IFG LT.18',
  'F6-2V-DT-8A': 'CPI Balaraja',
};

interface AppNotification {
  id: string;
  dbId: number;
  title: string;
  message: string;
  severity: string;
  timestamp: string;
  type: 'threat' | 'event';
}

function RealtimeClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground font-mono shadow-sm opacity-0">
      00:00:00
    </div>
  );

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-mono shadow-sm text-cyan-400">
      {time.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </div>
  );
}

export function Header({
  lastUpdate = "—",
  isRefreshing = false,
  onRefresh = () => {},
  intervalText = "",
}: {
  lastUpdate?: string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  intervalText?: string;
}) {
  const [user, setUser] = useState<{ role?: string; agent_uuid?: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load threats and events
  const { data: threats } = useThreats(30);
  const { data: events } = useEvents(30);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(err => console.error(err));

    // Load read notifications
    const stored = localStorage.getItem('read_notifications');
    if (stored) {
      try {
        setReadIds(JSON.parse(stored));
      } catch {}
    }
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Combine threats and events into notifications
  const notifications = useMemo<AppNotification[]>(() => {
    const list: AppNotification[] = [];

    if (threats) {
      for (const t of threats) {
        list.push({
          id: `threat-${t.id || t.detected_at}`,
          dbId: t.id,
          title: "Ancaman Terdeteksi!",
          message: `${t.threat_type || "Malicious traffic"} dari IP ${t.ip_address || "unknown"}`,
          severity: t.severity || "high",
          timestamp: t.detected_at || "",
          type: "threat"
        });
      }
    }

    if (events) {
      for (const e of events) {
        const severity = (e.severity || "info").toLowerCase();
        if (severity === "critical" || severity === "high" || severity === "medium" || severity === "warning") {
          list.push({
            id: `event-${e.id || e.timestamp}`,
            dbId: e.id,
            title: `Event: ${e.event_type || "Sistem"}`,
            message: e.message || "",
            severity: e.severity || "warning",
            timestamp: e.timestamp || "",
            type: "event"
          });
        }
      }
    }

    // Sort by timestamp desc
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return list;
  }, [threats, events]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !readIds.includes(n.id)).length;
  }, [notifications, readIds]);

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadIds(allIds);
    localStorage.setItem('read_notifications', JSON.stringify(allIds));
  };

  const handleNotificationClick = (n: AppNotification) => {
    if (!readIds.includes(n.id)) {
      const updated = [...readIds, n.id];
      setReadIds(updated);
      localStorage.setItem('read_notifications', JSON.stringify(updated));
    }
    setIsOpen(false);
    
    // Direct and highlight query
    const target = n.type === 'threat'
      ? `/threats?highlight=${n.dbId}`
      : `/events?highlight=${n.dbId}`;
    
    router.push(target);
  };

  const getSeverityStyles = (severity: string) => {
    const s = severity.toLowerCase();
    if (s.includes('critical') || s.includes('high')) {
      return {
        bg: 'bg-red-500/10 hover:bg-red-500/15',
        border: 'border-red-500/20',
        text: 'text-red-400',
        icon: <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
      };
    }
    if (s.includes('med') || s.includes('warning')) {
      return {
        bg: 'bg-yellow-500/10 hover:bg-yellow-500/15',
        border: 'border-yellow-500/20',
        text: 'text-yellow-400',
        icon: <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
      };
    }
    return {
      bg: 'bg-blue-500/10 hover:bg-blue-500/15',
      border: 'border-blue-500/20',
      text: 'text-blue-400',
      icon: <Info className="w-4 h-4 text-blue-500 shrink-0" />
    };
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Site: {process.env.NEXT_PUBLIC_SITE_ID || "Unknown Site"}
        </div>
        {intervalText && (
          <div className="flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs text-blue-400 font-medium">
            <Calendar className="w-3.5 h-3.5" />
            <span>Rentang Data: {intervalText}</span>
          </div>
        )}
        <RealtimeClock />
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

        {/* 🔔 Notifications Button & Panel */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="relative rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-white transition-colors focus:outline-none"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-lg">
                {unreadCount}
              </span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2.5 w-96 origin-top-right rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl p-4 shadow-2xl ring-1 ring-black/5 focus:outline-none z-50 animate-fade-in">
              <div className="flex items-center justify-between border-b border-border/50 pb-2.5 mb-2.5">
                <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-primary" /> Notifikasi
                  {unreadCount > 0 && (
                    <span className="text-[11px] text-muted-foreground font-normal">
                      ({unreadCount} baru)
                    </span>
                  )}
                </span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1 font-medium"
                  >
                    <Check className="w-3.5 h-3.5" /> Tandai semua dibaca
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Tidak ada notifikasi keamanan saat ini.
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isRead = readIds.includes(n.id);
                    const styles = getSeverityStyles(n.severity);
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`flex gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none group ${styles.bg} ${styles.border} ${!isRead ? 'ring-1 ring-primary/25 shadow-sm' : 'opacity-60 hover:opacity-100'}`}
                      >
                        {styles.icon}
                        <div className="flex-1 space-y-0.5 min-w-0">
                          <div className="flex justify-between items-start gap-1">
                            <span className={`text-xs font-semibold truncate ${styles.text}`}>
                              {n.title}
                            </span>
                            <span className="text-[9px] text-slate-500 whitespace-nowrap flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-normal line-clamp-2">
                            {n.message}
                          </p>
                        </div>
                        {!isRead && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 self-center" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
