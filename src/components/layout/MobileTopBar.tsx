"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { getSiteBranding } from "@/lib/branding";
import SidebarNotifications from "./SidebarNotifications";

interface MobileTopBarProps {
  onOpenMenu: () => void;
  selectedSite?: string;
}

export function MobileTopBar({ onOpenMenu, selectedSite }: MobileTopBarProps) {
  const [mounted, setMounted] = useState(false);
  const [site, setSite] = useState<string | undefined>(selectedSite);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    if (!selectedSite && typeof window !== "undefined") {
      const stored = localStorage.getItem("backone_site_uuid");
      if (stored) setSite(stored);
    }
  }, [selectedSite]);

  const branding = getSiteBranding(site);

  const getPageTitle = (path: string): string => {
    switch (path) {
      case "/": return "Overview";
      case "/devices": return "Devices";
      case "/flows": return "Flows";
      case "/threats": return "Threats";
      case "/apps": return "Apps";
      case "/agents": return "Agents";
      case "/dns": return "DNS Traffic";
      case "/dpi-analytics": return "DPI Analytics";
      case "/events": return "Events";
      case "/geography": return "Geo Traffic";
      case "/intelligence": return "Intelligence";
      case "/lookup": return "App Catalog";
      case "/network-infrastructure": return "Topology";
      case "/network-intelligence": return "Categories";
      case "/user-accounts": return "User Accounts";
      case "/device-labeling": return "Labeling";
      default: return "Dashboard";
    }
  };

  return (
    <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-card/90 border-b border-border/80 backdrop-blur-xl sticky top-0 z-30 w-full shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex items-center gap-2 shrink-0" suppressHydrationWarning>
          <img
            src={mounted ? branding.logo : "/backone-logo.png"}
            alt={mounted ? branding.name : "Logo"}
            className="w-6 h-6 object-contain"
            suppressHydrationWarning
          />
        </div>
        <div className="h-4 w-px bg-border/60 shrink-0" />
        <h1 className="font-bold text-sm text-white tracking-tight truncate">
          {getPageTitle(pathname)}
        </h1>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="truncate max-w-[70px]">{mounted ? branding.name : "DPI"}</span>
        </div>
        <SidebarNotifications placement="topbar" />
      </div>
    </header>
  );
}

