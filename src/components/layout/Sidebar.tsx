"use client";

import { cn } from "@/lib/utils";
import {
  Activity,
  AppWindow,
  Globe,
  LayoutDashboard,
  Shield,
  ShieldAlert,
  Server,
  Zap,
  Radio,
  Lock,
  Search
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Summary", href: "/", icon: LayoutDashboard },
  { name: "Agents", href: "/agents", icon: Server },
  { name: "Devices", href: "/devices", icon: Server },
  { name: "Flows", href: "/flows", icon: Activity },
  { name: "Apps", href: "/apps", icon: AppWindow },
  { name: "App Database", href: "/lookup", icon: Search },
  { name: "Threats", href: "/threats", icon: ShieldAlert },
  { name: "Geography", href: "/geography", icon: Globe },
  { name: "DNS", href: "/dns", icon: Radio },
  { name: "Events", href: "/events", icon: Zap },
  { name: "Network Intelligence", href: "/network-intelligence", icon: Activity },
  { name: "Security Audit", href: "/security-audit", icon: Lock },
  { name: "Intelligence", href: "/intelligence", icon: Shield },
  { name: "Network Infra", href: "/network-infrastructure", icon: Server },
  { name: "DPI Analytics", href: "/dpi-analytics", icon: Activity },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r border-border/50 bg-sidebar/80 backdrop-blur-2xl relative">
      {/* Subtle glow effect behind sidebar */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="flex h-[72px] shrink-0 items-center px-6 border-b border-border/50 relative z-10">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 mr-3 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <span className="text-lg font-bold text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
          Netify
        </span>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto relative z-10">
        <nav className="flex-1 space-y-1.5 px-3 py-6">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 overflow-hidden",
                  isActive
                    ? "bg-primary/10 text-white shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-white"
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                )}
                
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 shrink-0 transition-all duration-300",
                    isActive 
                      ? "text-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] scale-110" 
                      : "text-muted-foreground group-hover:text-white group-hover:scale-110"
                  )}
                  aria-hidden="true"
                />
                <span className="relative z-10">{item.name}</span>
                
                {/* Hover background effect */}
                {!isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none translate-x-[-100%] group-hover:translate-x-[100%] transition-transform" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
