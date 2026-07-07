"use client";

import { usePathname } from "next/navigation";
import ViewAsAgentBanner from "@/components/admin/ViewAsAgentBanner";

export function Header() {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === "/apps") return "Applications";
    if (pathname === "/devices") return "Devices Inventory";
    if (pathname === "/threats") return "Cyber Threats";
    if (pathname === "/flows") return "Network Flows";
    if (pathname === "/dns") return "DNS Queries";
    if (pathname === "/events") return "Security Events";
    return "Network Overview";
  };

  return (
    <div className="flex flex-col w-full z-50 sticky top-0 bg-background/70 backdrop-blur-xl border-b border-border/40">
      <ViewAsAgentBanner />
      
      <div className="flex items-center justify-between px-6 py-4 h-16">
        {/* Left Side: Page Title Only (Minimalist) */}
        <div className="flex items-center space-x-2.5">
          <h1 className="text-xl font-bold text-foreground flex items-center tracking-tight">
            {getPageTitle()}
            {pathname === '/threats' && (
              <span className="ml-3 flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </h1>
        </div>
        
        {/* Right Side: Empty for extreme minimalist look */}
        <div className="flex items-center">
          {/* Ornamen lain bisa ditambahkan di masa depan jika diperlukan */}
        </div>
      </div>
    </div>
  );
}
