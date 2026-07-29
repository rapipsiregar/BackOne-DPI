// src/components/layout/Sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AccountSettingsModal } from "./AccountSettingsModal";
import { getViewAsHeaders } from "@/lib/admin-api";
import { NAVIGATION_GROUPS } from "./SidebarData";
import SidebarProfile from "./SidebarProfile";
import SidebarNotifications from "./SidebarNotifications";
import SidebarSiteSelector from "./SidebarSiteSelector";
import SidebarTimeSelector from "./SidebarTimeSelector";
import { getSiteBranding } from "@/lib/branding";

export function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ username?: string; account_name?: string; profile_picture?: string; role?: string; agent_uuid?: string; agent_uuids?: string[]; company_name?: string; _isViewAsMode?: boolean } | null>(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [intervalText, setIntervalText] = useState<string>("");
  const [selectedSite, setSelectedSite] = useState<string>("6681452d_9cae_4ff4_8ae8_0d504774265e");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch('/api/auth/me', { headers: getViewAsHeaders() })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          
          // Role-aware site UUID logic:
          // - Global roles (SUPER_ADMIN, EXECUTIVE, SOC_ANALYST, ENGINEER):
          //   Prioritaskan pilihan yang TERSIMPAN di localStorage.
          //   Hanya set dari DB jika belum ada pilihan tersimpan.
          //   Ini agar site switcher tidak reset ke SIAB setiap page reload.
          // - Restricted roles (TENANT_ADMIN, AGENT_VIEWER, COMPANY_*):
          //   Selalu pakai site_uuid dari DB (mereka tidak bisa ganti site).
          const globalRoles = ['SUPER_ADMIN', 'EXECUTIVE', 'SOC_ANALYST', 'ENGINEER'];
          const isGlobalRole = globalRoles.includes(data.user.role || '');
          const storedSiteUuid = localStorage.getItem('backone_site_uuid');
          
          if (isGlobalRole) {
            // Pakai localStorage jika sudah ada, fallback ke DB, fallback ke SIAB default
            const siteToUse = storedSiteUuid || data.user.site_uuid || '6681452d_9cae_4ff4_8ae8_0d504774265e';
            localStorage.setItem('backone_site_uuid', siteToUse);
            setSelectedSite(siteToUse);
          } else if (data.user.site_uuid) {
            // Restricted roles: selalu pakai site_uuid dari DB (tidak bisa switch)
            localStorage.setItem('backone_site_uuid', data.user.site_uuid);
            setSelectedSite(data.user.site_uuid);
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
      if (stored) {
        setSelectedSite(stored);
      }
    }
  }, []);

  const branding = getSiteBranding(selectedSite);
  const isNexus = branding.name === "Nexus";



  const handleSiteSelect = (val: string) => {
    setSelectedSite(val);
    localStorage.setItem('backone_site_uuid', val);
    window.location.reload();
  };

  return (
    <div 
      className="flex h-full max-h-screen flex-col border-r border-white/5 bg-black/20 backdrop-blur-3xl transition-all w-64 shrink-0 relative z-40 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.5)]"
    >
      {/* Brand & Site Info */}
      <div className="flex flex-col p-2 shrink-0 gap-4 border-b border-white/5">
        <div className="flex flex-col items-center justify-center w-full pt-6 pb-3 px-3 text-center mx-auto">
          <img 
            src={mounted ? branding.logo : "/backone-logo.png"} 
            alt="Logo" 
            className={cn(
              "w-12 h-12 object-contain shrink-0 mb-3",
              (mounted && isNexus) 
                ? "drop-shadow-[0_0_12px_rgba(6,182,212,0.45)]" 
                : "drop-shadow-[0_0_12px_rgba(168,85,247,0.45)]"
            )} 
          />
          <span className="text-[9.5px] uppercase tracking-[0.18em] text-slate-300 font-mono font-bold block">
            Deep Package Inspection
          </span>
          <div className="flex items-center gap-1.5 mt-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            DPI ENGINE: ACTIVE
          </div>
        </div>

        <SidebarSiteSelector
          user={user}
          selectedSite={selectedSite}
          handleSiteSelect={handleSiteSelect}
        />

        <SidebarTimeSelector />
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
            const allowedItems = group.items.filter((item) => {
              if (item.href === "/agents") {
                // Agents visible untuk: admin roles + COMPANY_ADMIN + COMPANY_OPERATOR
                // COMPANY_VIEWER TIDAK mendapat tab Agents — mereka hanya butuh dashboard data
                return user?.role === "SUPER_ADMIN" || user?.role === "EXECUTIVE" || user?.role === "TENANT_ADMIN" || user?.role === "COMPANY_ADMIN" || user?.role === "COMPANY_OPERATOR";
              }
              if (item.href === "/device-labeling") {
                return user?.role === "SUPER_ADMIN" || user?.role === "EXECUTIVE" || user?.role === "TENANT_ADMIN" || user?.role === "COMPANY_ADMIN" || user?.role === "COMPANY_OPERATOR";
              }
              if (item.href === "/user-accounts") {
                // User Accounts hanya untuk: admin + COMPANY_ADMIN (yang mengelola sub-user)
                // COMPANY_OPERATOR dan COMPANY_VIEWER TIDAK bisa akses halaman ini
                return user?.role === "SUPER_ADMIN" || user?.role === "EXECUTIVE" || user?.role === "COMPANY_ADMIN";
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
                        "group flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium tracking-wide transition-all duration-300",
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
