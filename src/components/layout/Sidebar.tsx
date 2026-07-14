// src/components/layout/Sidebar.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AccountSettingsModal } from "./AccountSettingsModal";
import { useTimeFilter } from "@/contexts/TimeFilterContext";
import { useTenantConfig } from "@/contexts/TenantConfigContext";
import { getViewAsHeaders } from "@/lib/admin-api";
import { NAVIGATION_GROUPS, TIME_OPTIONS } from "./SidebarData";
import SidebarProfile from "./SidebarProfile";
import SidebarNotifications from "./SidebarNotifications";
import { SidebarSiteSwitcher } from "./SidebarSiteSwitcher";
import { SidebarTimeFilter } from "./SidebarTimeFilter";

export function Sidebar() {
  const pathname = usePathname();
  const { timeRange, setTimeRange } = useTimeFilter();
  const { tenantConfig } = useTenantConfig();

  const [user, setUser] = useState<{ username?: string; account_name?: string; profile_picture?: string; role?: string; agent_uuid?: string } | null>(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [intervalText, setIntervalText] = useState<string>("");

  const timeDropdownRef = useRef<HTMLDivElement>(null);
  const selectedTimeOption = TIME_OPTIONS.find(opt => opt.value === timeRange) || TIME_OPTIONS[3];

  const [selectedSite, setSelectedSite] = useState<string>("6681452d_9cae_4ff4_8ae8_0d504774265e");
  const [isSiteDropdownOpen, setIsSiteDropdownOpen] = useState(false);
  const siteDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me', { headers: getViewAsHeaders() })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          if (data.user.site_uuid && data.user.role !== 'SUPER_ADMIN') {
            const currentStored = localStorage.getItem('backone_site_uuid');
            if (currentStored !== data.user.site_uuid) {
              localStorage.setItem('backone_site_uuid', data.user.site_uuid);
              setSelectedSite(data.user.site_uuid);
              window.location.reload();
            }
          }
        }
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

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('backone_site_uuid');
      if (stored) setSelectedSite(stored);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(event.target as Node)) setIsTimeDropdownOpen(false);
      if (siteDropdownRef.current && !siteDropdownRef.current.contains(event.target as Node)) setIsSiteDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSiteSelect = (val: string) => {
    setSelectedSite(val);
    localStorage.setItem('backone_site_uuid', val);
    setIsSiteDropdownOpen(false);
    window.location.reload();
  };

  const getSiteLabel = (uuid: string) => {
    if (uuid === 'd7902405_0dc2_458b_8584_ed4d24b64f24') return 'Nexus';
    return 'SIAB';
  };

  return (
    <div className="flex h-full max-h-screen flex-col border-r border-white/5 bg-black/20 backdrop-blur-3xl transition-all w-64 shrink-0 relative z-40 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.5)]">
      {/* Brand & Site Info */}
      <div className="flex flex-col p-2 shrink-0 gap-4 border-b border-white/5">
        <div className="flex flex-col items-center justify-center text-center w-full pt-4 pb-2 px-2 gap-2">
          <img 
            src={tenantConfig?.brandLogo || "/backone-logo.png"} 
            alt="Brand Logo" 
            className="h-10 object-contain drop-shadow-[0_0_12px_rgba(255,0,0,0.2)] shrink-0" 
          />
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[9px] uppercase tracking-[0.1em] text-slate-400 font-semibold mt-1">
              Deep Package Inspection
            </span>
            <div className="flex items-center gap-1.5 mt-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold px-2 py-0.5 rounded-full w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              DPI ENGINE: ACTIVE
            </div>
          </div>
        </div>

        {/* Global Site Switcher Widget */}
        <SidebarSiteSwitcher
          user={user}
          selectedSite={selectedSite}
          isSiteDropdownOpen={isSiteDropdownOpen}
          setIsSiteDropdownOpen={setIsSiteDropdownOpen}
          siteDropdownRef={siteDropdownRef}
          handleSiteSelect={handleSiteSelect}
          getSiteLabel={getSiteLabel}
        />

        {/* Global Time Filter Widget */}
        <SidebarTimeFilter
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          isTimeDropdownOpen={isTimeDropdownOpen}
          setIsTimeDropdownOpen={setIsTimeDropdownOpen}
          timeDropdownRef={timeDropdownRef}
          selectedTimeOption={selectedTimeOption}
          timeOptions={TIME_OPTIONS}
        />
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar h-full">
        {intervalText && (
          <div className="mb-4 rounded-lg bg-blue-500/5 border border-blue-500/10 p-2 text-center">
            <span className="text-[9px] uppercase tracking-wider text-blue-400 font-bold block mb-0.5">Telemetry Window</span>
            <span className="text-[10px] text-slate-400 block font-mono">{intervalText}</span>
          </div>
        )}

        <nav className="flex flex-col gap-5">
          {NAVIGATION_GROUPS.map((group) => {
            const allowedItems = group.items.filter((item) => {
              if (item.href === "/agents") {
                return user?.role === "SUPER_ADMIN" || user?.role === "TENANT_ADMIN";
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
