"use client";

import React from "react";
import { Activity, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarSiteSwitcherProps {
  user: { role?: string; site_uuid?: string | null } | null;
  selectedSite: string;
  isSiteDropdownOpen: boolean;
  setIsSiteDropdownOpen: (open: boolean) => void;
  siteDropdownRef: React.RefObject<HTMLDivElement | null>;
  handleSiteSelect: (val: string) => void;
  getSiteLabel: (uuid: string) => string;
}

export function SidebarSiteSwitcher({
  user,
  selectedSite,
  isSiteDropdownOpen,
  setIsSiteDropdownOpen,
  siteDropdownRef,
  handleSiteSelect,
  getSiteLabel,
}: SidebarSiteSwitcherProps) {
  const isGlobalUser = user?.role === 'SUPER_ADMIN' ||
    user?.role === 'EXECUTIVE' ||
    ((!user?.site_uuid || user?.site_uuid === 'default') && ['SOC_ANALYST', 'ENGINEER'].includes(user?.role || ''));

  if (!user || !isGlobalUser) {
    return null;
  }

  return (
    <div className="relative w-full px-2" ref={siteDropdownRef}>
      <button
        onClick={() => setIsSiteDropdownOpen(!isSiteDropdownOpen)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] p-2.5 text-xs text-slate-300 transition-colors"
      >
        <div className="flex items-center gap-2 truncate">
          <Activity className="h-3.5 w-3.5 text-primary shrink-0" />
          <div className="flex flex-col items-start truncate leading-normal">
            <span className="font-semibold text-[10px] text-primary uppercase tracking-wider">Active Site</span>
            <span className="truncate max-w-[130px]">{getSiteLabel(selectedSite)}</span>
          </div>
        </div>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-300", isSiteDropdownOpen && "rotate-180")} />
      </button>

      <div
        className={cn(
          "absolute top-full left-2 right-2 mt-1 rounded-xl border border-white/10 bg-slate-950 p-1.5 shadow-2xl z-50 origin-top transition-all duration-300 ease-out",
          isSiteDropdownOpen
            ? "opacity-100 scale-100 pointer-events-auto translate-y-0"
            : "opacity-0 scale-95 pointer-events-none -translate-y-2"
        )}
      >
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => handleSiteSelect('6681452d_9cae_4ff4_8ae8_0d504774265e')}
            className={cn(
              "w-full rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors",
              selectedSite === '6681452d_9cae_4ff4_8ae8_0d504774265e'
                ? "bg-primary/20 text-white font-medium"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
          >
            SIAB
          </button>
          <button
            onClick={() => handleSiteSelect('d7902405_0dc2_458b_8584_ed4d24b64f24')}
            className={cn(
              "w-full rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors",
              selectedSite === 'd7902405_0dc2_458b_8584_ed4d24b64f24'
                ? "bg-primary/20 text-white font-medium"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
          >
            Nexus
          </button>
        </div>
      </div>
    </div>
  );
}
