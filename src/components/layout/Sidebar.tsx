"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Server, Activity, Globe, Radio, Zap,
  ShieldAlert, Shield, Lock, AppWindow, Search,
  Bell, Check, Clock, ChevronDown, User, LogOut, Sun, Moon, AlertTriangle, Info, Calendar, Router
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useThreats, useEvents } from "@/lib/api";
import { AccountSettingsModal } from "./AccountSettingsModal";
import { useTimeFilter } from "@/contexts/TimeFilterContext";

interface AppNotification {
  id: string;
  dbId: number;
  title: string;
  message: string;
  severity: string;
  timestamp: string;
  type: 'threat' | 'event';
}

const navigationGroups = [
  {
    title: "OVERVIEW",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
    ]
  },
  {
    title: "INFRASTRUCTURE",
    items: [
      { name: "Devices", href: "/devices", icon: Router },
      { name: "Agents", href: "/agents", icon: Server },
      { name: "Topology", href: "/network-infrastructure", icon: Globe },
    ]
  },
  {
    title: "MONITORING",
    items: [
      { name: "Flows", href: "/flows", icon: Activity },
      { name: "Apps", href: "/apps", icon: AppWindow },
      { name: "DNS", href: "/dns", icon: Radio },
      { name: "Events", href: "/events", icon: Zap },
    ]
  },
  {
    title: "MANAGEMENT",
    items: [
      { name: "Lookup", href: "/lookup", icon: Search },
      { name: "Threats", href: "/threats", icon: ShieldAlert },
    ]
  },
  {
    title: "SYSTEM",
    items: [
      { name: "Geography", href: "/geography", icon: Globe },
      { name: "Network Intelligence", href: "/network-intelligence", icon: Activity },
      { name: "Security Audit", href: "/security-audit", icon: Lock },
      { name: "Intelligence", href: "/intelligence", icon: Shield },
      { name: "DPI Analytics", href: "/dpi-analytics", icon: Activity },
    ]
  }
];

const TIME_OPTIONS = [
  { value: "5m", label: "Last 5 Minutes" },
  { value: "10m", label: "Last 10 Minutes" },
  { value: "30m", label: "Last 30 Minutes" },
  { value: "1h", label: "Last 1 Hour" },
  { value: "1d", label: "Last 24 Hours" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { timeRange, setTimeRange } = useTimeFilter();

  // State
  const [user, setUser] = useState<{ username?: string; account_name?: string; profile_picture?: string; role?: string; agent_uuid?: string } | null>(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Notifications
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false); // Time Filter
  const [readIds, setReadIds] = useState<string[]>([]);
  const [intervalText, setIntervalText] = useState<string>("");

  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeDropdownRef = useRef<HTMLDivElement>(null);

  const selectedTimeOption = TIME_OPTIONS.find(opt => opt.value === timeRange) || TIME_OPTIONS[3];

  // Fetching
  const { data: threats } = useThreats(30);
  const { data: events } = useEvents(30);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .catch(console.error);

    const stored = localStorage.getItem('read_notifications');
    if (stored) {
      try { setReadIds(JSON.parse(stored)); } catch {}
    }

    // Fetch interval
    fetch('/api/dashboard/data-interval')
      .then((res) => res.json())
      .then((res) => {
        if (res.ok && res.data) {
          const { start, end } = res.data;
          if (start && end) {
            const sDate = new Date(start);
            const eDate = new Date(end);
            const options: Intl.DateTimeFormatOptions = {
              day: 'numeric', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit', hour12: false
            };
            setIntervalText(`${sDate.toLocaleString('id-ID', options)} - ${eDate.toLocaleString('id-ID', options)}`);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) setIsAccountDropdownOpen(false);
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(event.target as Node)) setIsTimeDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        if (["critical", "high", "medium", "warning"].includes(severity)) {
          const eventTypeLabel = (e.event_type || 'Sistem')
            .replace('new.device', 'New Device Discovered')
            .replace('update.device', 'Device Updated')
            .replace('server.discovery', 'Server Discovered')
            .replace('encryption.audit', 'Encryption Alert')
            .replace(/\./g, ' ');

          list.push({
            id: `event-${e.id || e.timestamp}`,
            dbId: e.id,
            title: `Event: ${eventTypeLabel}`,
            message: e.message || "",
            severity: e.severity || "warning",
            timestamp: e.timestamp || "",
            type: "event"
          });
        }
      }
    }
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return list;
  }, [threats, events]);

  const unreadCount = useMemo(() => notifications.filter(n => !readIds.includes(n.id)).length, [notifications, readIds]);

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
    router.push(n.type === 'threat' ? `/threats?highlight=${n.dbId}` : `/events?highlight=${n.dbId}`);
  };

  const getSeverityStyles = (severity: string) => {
    const s = severity.toLowerCase();
    if (s.includes('critical') || s.includes('high')) {
      return { bg: 'bg-red-500/10 hover:bg-red-500/15', border: 'border-red-500/20', text: 'text-red-400', icon: <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" /> };
    }
    if (s.includes('med') || s.includes('warning')) {
      return { bg: 'bg-yellow-500/10 hover:bg-yellow-500/15', border: 'border-yellow-500/20', text: 'text-yellow-400', icon: <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" /> };
    }
    return { bg: 'bg-blue-500/10 hover:bg-blue-500/15', border: 'border-blue-500/20', text: 'text-blue-400', icon: <Info className="w-4 h-4 text-blue-500 shrink-0" /> };
  };

  return (
    <div className="flex h-full max-h-screen flex-col border-r border-white/5 bg-black/20 backdrop-blur-3xl transition-all w-64 shrink-0 relative z-40 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.5)]">
      {/* Brand & Site Info */}
      <div className="flex flex-col p-2 shrink-0 gap-4 border-b border-white/5">
        <div className="flex items-center justify-center gap-3 w-full pt-4 pb-2 px-1">
          <img src="/backone-logo.png" alt="BackOne Logo" className="w-9 h-9 rounded-full drop-shadow-[0_0_12px_rgba(255,0,0,0.35)] shrink-0" />
          <div className="flex flex-col min-w-0 justify-center text-left">
            <span className="text-xl font-bold font-backone text-foreground tracking-tight leading-none">
              BackOne
            </span>
            <span className="text-[11px] text-muted-foreground mt-1 leading-tight tracking-wider whitespace-nowrap">
              Deep Package Inspection
            </span>
          </div>
        </div>
        
        {/* Site Badge */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 rounded bg-secondary/30 px-2 py-1.5 text-xs text-muted-foreground">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
            <span className="truncate flex-1">
              {process.env.NEXT_PUBLIC_SITE_ID || "Unknown Site"} - {user?.role === 'SUPER_ADMIN' ? 'Admin' : (user?.account_name || user?.agent_uuid || 'User')}
            </span>
          </div>
          {intervalText && (
            <div className="flex items-center gap-2 rounded bg-blue-500/10 border border-blue-500/20 px-2 py-1.5 text-[10px] text-blue-400 whitespace-nowrap">
              <Calendar className="w-3 h-3 shrink-0" />
              <span className="truncate">{intervalText}</span>
            </div>
          )}
          
          {/* Time Filter Dropdown */}
          <div className="relative mt-1" ref={timeDropdownRef}>
            <button
              onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
              className="flex w-full items-center justify-between gap-2 rounded bg-secondary/20 hover:bg-secondary/50 px-2 py-1.5 transition-colors border border-border/20 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-foreground font-medium">{selectedTimeOption.label}</span>
              </div>
              <ChevronDown 
                className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-1000 ${isTimeDropdownOpen ? 'rotate-180' : ''}`} 
              />
            </button>
            <AnimatePresence>
              {isTimeDropdownOpen && (
                <motion.div 
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginTop: '0.375rem' }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="w-full rounded-md border border-white/10 bg-black/40 flex flex-col p-1">
                    {TIME_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setTimeRange(option.value as any);
                          setIsTimeDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between rounded px-2 py-1.5 text-xs transition-colors ${
                          timeRange === option.value 
                            ? 'bg-primary/20 text-primary font-semibold' 
                            : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                        }`}
                      >
                        {option.label}
                        {timeRange === option.value && <Check className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar min-h-0">
        <nav className="flex flex-col space-y-6">
          {navigationGroups.map((group, groupIdx) => {
            // Filter items based on role
            const filteredItems = group.items.filter(item => !(user?.role === 'AGENT_VIEWER' && item.name === 'Agents'));
            if (filteredItems.length === 0) return null;

            return (
              <div key={groupIdx} className="flex flex-col space-y-1">
                <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  {group.title}
                </h3>
                {filteredItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-primary/15 text-primary shadow-[inset_2px_0_0_0_hsl(var(--primary))]"
                          : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "mr-3 h-4 w-4 shrink-0 transition-transform",
                          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground group-hover:scale-110"
                        )}
                        aria-hidden="true"
                      />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer (Account & Notifications) */}
      <div className="mt-auto p-4 border-t border-white/5 bg-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* Account Settings Dropdown */}
          <div className="relative flex-1 min-w-0" ref={accountDropdownRef}>
            <button
              onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
              className="flex w-full items-center gap-3 rounded-xl p-2 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-blue-400 overflow-hidden">
                {user?.profile_picture ? (
                  <img src={`/api/uploads/${user.profile_picture}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-white uppercase text-xs">
                    {user?.account_name ? user.account_name.charAt(0) : (user?.username ? user.username.charAt(0) : (user?.role === 'SUPER_ADMIN' ? 'A' : 'V'))}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-start overflow-hidden text-left min-w-0 flex-1">
                <span className="text-sm font-semibold text-foreground truncate w-full">{user?.account_name || user?.username || 'Loading...'}</span>
                <span className="text-[10px] text-primary truncate w-full">{user?.role === 'SUPER_ADMIN' ? 'Admin' : 'Standard User'}</span>
              </div>
            </button>

            {isAccountDropdownOpen && (
              <div className="absolute bottom-0 left-full ml-4 w-56 rounded-xl border border-border bg-card/95 backdrop-blur-xl p-2 shadow-2xl z-50 animate-fade-in">
                <div className="flex flex-col items-center justify-center p-3 mb-2 border-b border-border/50">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-blue-400 overflow-hidden mb-2">
                    {user?.profile_picture ? (
                      <img src={`/api/uploads/${user.profile_picture}`} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-white uppercase text-lg">
                        {user?.account_name ? user.account_name.charAt(0) : (user?.username ? user.username.charAt(0) : (user?.role === 'SUPER_ADMIN' ? 'A' : 'V'))}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-foreground text-center break-words w-full leading-tight">{user?.account_name || user?.username || 'Loading...'}</span>
                  <span className="text-xs text-primary mt-1 text-center font-medium">{user?.role === 'SUPER_ADMIN' ? 'Admin' : 'Standard User'}</span>
                </div>
                
                <button
                  onClick={() => {
                    setIsAccountDropdownOpen(false);
                    setIsAccountOpen(true);
                  }}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <User className="h-4 w-4" /> Account Settings
                </button>
                <button
                  onClick={() => {
                    setTheme(theme === 'dark' ? 'light' : 'dark');
                    setIsAccountDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />} 
                  <span className="truncate">{theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
                </button>
                <div className="h-px bg-border/50 my-1 mx-2" />
                <button
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    router.push('/login');
                    router.refresh();
                  }}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-[#ffffff] shadow-lg ring-2 ring-transparent">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {isOpen && (
              <div className="absolute bottom-0 left-full ml-4 w-96 rounded-2xl border border-border bg-card/95 backdrop-blur-xl p-3 shadow-2xl z-50 animate-fade-in">
                <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-2">
                  <span className="text-sm font-semibold text-foreground">Notifikasi</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-primary hover:text-primary/80">Tandai dibaca</button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">Tidak ada notifikasi</div>
                  ) : (
                    notifications.map((n) => {
                      const isRead = readIds.includes(n.id);
                      const styles = getSeverityStyles(n.severity);
                      return (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`flex gap-2 p-2 rounded-lg border transition-all cursor-pointer ${styles.bg} ${styles.border} ${!isRead ? 'ring-1 ring-primary/25 opacity-100' : 'opacity-60'}`}
                        >
                          {styles.icon}
                          <div className="flex-1 space-y-0.5">
                            <div className="flex justify-between items-start">
                              <span className={`text-xs font-semibold ${styles.text} line-clamp-1`}>{n.title}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground line-clamp-2">{n.message}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AccountSettingsModal isOpen={isAccountOpen} onClose={() => setIsAccountOpen(false)} user={user} setUser={setUser} />
    </div>
  );
}
