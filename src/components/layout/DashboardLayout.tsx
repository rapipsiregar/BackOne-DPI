"use client";

import { ReactNode, useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { getViewAsStatusSync, validateViewAsSession } from "@/lib/admin-api";
import { HelpCenterFAB } from "@/components/ui/HelpCenterFAB";
import { useInactivityTimeout } from "@/hooks/useInactivityTimeout";
import { usePathname } from "next/navigation";
import { getSiteBranding } from "@/lib/branding";
import { MobileTopBar } from "./MobileTopBar";
import { MobileBottomBar } from "./MobileBottomBar";
import { ViewAsBanner } from "./ViewAsBanner";
import { SessionTimeoutModal } from "./SessionTimeoutModal";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [viewAs, setViewAs] = useState<any>({ active: false });
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const branding = getSiteBranding();
    const getPageTitlePrefix = (path: string): string => {
      switch (path) {
        case "/": return "Overview Dashboard";
        case "/agents": return "Agents";
        case "/apps": return "Apps";
        case "/devices": return "Devices";
        case "/dns": return "DNS";
        case "/dpi-analytics": return "DPI MetaData";
        case "/events": return "Recent Events";
        case "/flows": return "Flows";
        case "/geography": return "Geo Traffic";
        case "/intelligence": return "Threat Intelligence";
        case "/lookup": return "App Lookup";
        case "/network-infrastructure": return "Network Topology";
        case "/network-intelligence": return "Traffic Categories";
        case "/threats": return "Detected Threats";
        case "/help": return "User Guide";
        default: return "";
      }
    };

    const updateTitleAndFavicon = () => {
      if (typeof document !== 'undefined') {
        const prefix = getPageTitlePrefix(pathname);
        document.title = prefix ? `${prefix} | ${branding.name} - Deep Package Inspection` : `${branding.name} - Deep Package Inspection`;
        const logoUrl = branding.logo;
        const links = document.querySelectorAll("link[rel*='icon']");
        if (links.length > 0) {
          links.forEach(l => (l as HTMLLinkElement).href = logoUrl);
        } else {
          const l = document.createElement('link');
          l.rel = 'icon';
          l.href = logoUrl;
          document.head.appendChild(l);
        }
      }
    };

    updateTitleAndFavicon();
    const timer = setTimeout(updateTitleAndFavicon, 50);
    return () => clearTimeout(timer);
  }, [pathname]);

  const {
    showWarning: showTimeoutWarning,
    timeLeft,
    isRenewing,
    handleRenewSession,
    handleLogout
  } = useInactivityTimeout({
    timeoutSeconds: 60 * 60,
    warningSeconds: 2 * 60
  });

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => {
        if (res.status === 401) {
          window.location.href = "/login";
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data && data.user) {
          setUser(data.user);
          const originalRole = data.user._originalRole || data.user.role;
          setViewAs(validateViewAsSession(originalRole));
        } else {
          setViewAs(getViewAsStatusSync());
        }
      })
      .catch(() => setViewAs(getViewAsStatusSync()));
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-transparent transition-colors duration-500 relative">
      {/* Desktop Sidebar (hidden on mobile/tablet) */}
      <div className="hidden lg:flex h-full shrink-0">
        <Sidebar />
      </div>

      {/* Mobile / Tablet Drawer Sidebar (hidden on desktop) */}
      <div 
        className={`fixed inset-0 z-50 flex lg:hidden transition-all duration-500 ease-in-out ${
          isMobileMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <div 
          className={`relative z-10 flex w-72 max-w-[80vw] flex-col bg-card shadow-2xl h-full transform transition-transform duration-500 ease-in-out ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar isMobile onClose={() => setIsMobileMenuOpen(false)} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden w-full min-w-0 relative transition-all duration-500 ease-in-out">
        <MobileTopBar onOpenMenu={() => setIsMobileMenuOpen(true)} />
        <ViewAsBanner viewAs={viewAs} />

        <main suppressHydrationWarning className="flex-1 overflow-y-auto overflow-x-hidden bg-transparent p-2.5 sm:p-5 lg:p-8 pb-24 lg:pb-8 transition-all duration-500 ease-in-out w-full relative min-w-0">
          <div suppressHydrationWarning className="w-full min-w-0 space-y-4 sm:space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (< 1024px) */}
      <MobileBottomBar onOpenMenu={() => setIsMobileMenuOpen(true)} />

      <SessionTimeoutModal
        showWarning={showTimeoutWarning}
        timeLeft={timeLeft}
        isRenewing={isRenewing}
        onRenew={handleRenewSession}
        onLogout={handleLogout}
      />

      <HelpCenterFAB />
    </div>
  );
}
