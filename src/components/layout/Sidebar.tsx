// src/components/layout/Sidebar.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Calendar } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AccountSettingsModal } from "./AccountSettingsModal";
import { useTimeFilter } from "@/contexts/TimeFilterContext";
import { getViewAsHeaders } from "@/lib/admin-api";
import { NAVIGATION_GROUPS, TIME_OPTIONS } from "./SidebarData";
import SidebarProfile from "./SidebarProfile";
import SidebarNotifications from "./SidebarNotifications";

export function Sidebar() {
  const pathname = usePathname();
  const { timeRange, setTimeRange } = useTimeFilter();

  const [user, setUser] = useState<{ username?: string; account_name?: string; profile_picture?: string; role?: string; agent_uuid?: string } | null>(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false); // Time Filter dropdown
  const [intervalText, setIntervalText] = useState<string>("");

  const timeDropdownRef = useRef<HTMLDivElement>(null);
  const selectedTimeOption = TIME_OPTIONS.find(opt => opt.value === timeRange) || TIME_OPTIONS[3];

  useEffect(() => {
    fetch('/api/auth/me', { headers: getViewAsHeaders() })
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .catch(console.error);

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
      .catch(() => { });
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(event.target as Node)) setIsTimeDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mt-1">
              Deep Package Inspection
            </span>
          </div>
        </div>

        {/* Global Time Filter Widget */}
        <div className="relative w-full px-2 pb-2" ref={timeDropdownRef}>
          <button
            onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
            className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] p-2.5 text-xs text-slate-300 transition-colors"
          >
            <div className="flex items-center gap-2 truncate">
              <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
              <div className="flex flex-col items-start truncate leading-normal">
                <span className="font-semibold text-[10px] text-primary uppercase tracking-wider">Time Filter</span>
                <span className="truncate max-w-[130px]">{selectedTimeOption.label}</span>
              </div>
            </div>
            <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-300", isTimeDropdownOpen && "rotate-180")} />
          </button>

          {isTimeDropdownOpen && (
            <div className="absolute top-full left-2 right-2 mt-1 rounded-xl border border-white/10 bg-slate-950 p-1.5 shadow-2xl z-50">
              <div className="flex flex-col gap-0.5 max-h-60 overflow-y-auto custom-scrollbar">
                {TIME_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setTimeRange(opt.value);
                      setIsTimeDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors",
                      timeRange === opt.value
                        ? "bg-primary/20 text-white font-medium"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation (Flexible Scrollable Container for Rule 9) */}
      <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar h-full">
        {intervalText && (
          <div className="mb-4 rounded-lg bg-blue-500/5 border border-blue-500/10 p-2 text-center">
            <span className="text-[9px] uppercase tracking-wider text-blue-400 font-bold block mb-0.5">Telemetry Window</span>
            <span className="text-[10px] text-slate-400 block font-mono">{intervalText}</span>
          </div>
        )}

        <nav className="flex flex-col gap-5">
          {NAVIGATION_GROUPS.map((group) => {
            // Role-based navigation item filtering
            const allowedItems = group.items.filter((item) => {
              if (item.href === "/agents") {
                return user?.role === "SUPER_ADMIN";
              }
              return true;
            });

            if (allowedItems.length === 0) return null;

            return (
              <div key={group.title} className="flex flex-col gap-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                  {group.title}
                </span>
                {allowedItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold tracking-wide transition-all duration-300",
                        isActive
                          ? "bg-primary/10 text-primary border-l-2 border-primary font-bold shadow-md shadow-primary/5"
                          : "text-slate-400 hover:bg-white/[0.02] hover:text-slate-200"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 transition-transform duration-500",
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
          <SidebarProfile user={user} onOpenSettings={() => setIsAccountOpen(true)} />
          <SidebarNotifications />
        </div>
      </div>

      <AccountSettingsModal isOpen={isAccountOpen} onClose={() => setIsAccountOpen(false)} user={user} setUser={setUser} />
    </div>
  );
}
