"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Laptop, Activity, ShieldAlert, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomBarProps {
  onOpenMenu: () => void;
}

export function MobileBottomBar({ onOpenMenu }: MobileBottomBarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Overview", href: "/", icon: LayoutDashboard },
    { name: "Devices", href: "/devices", icon: Laptop },
    { name: "Flows", href: "/flows", icon: Activity },
    { name: "Threats", href: "/threats", icon: ShieldAlert },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-card/95 border-t border-border/80 backdrop-blur-2xl shadow-2xl px-1 py-1.5 flex items-center justify-between w-full">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 relative min-w-0 text-center",
              isActive
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground active:scale-95"
            )}
          >
            {isActive && (
              <span className="absolute top-0 w-6 h-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            )}
            <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5 mb-0.5 transition-transform duration-200 shrink-0", isActive && "scale-110 text-primary")} />
            <span className="text-[10px] sm:text-xs font-medium tracking-tight truncate w-full">{item.name}</span>
          </Link>
        );
      })}

      {/* Menu Drawer Trigger */}
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl min-w-0 text-center text-muted-foreground hover:text-foreground active:scale-95 transition-all duration-200"
      >
        <Menu className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 text-slate-300 shrink-0" />
        <span className="text-[10px] sm:text-xs font-medium tracking-tight text-slate-300 truncate w-full">Menu</span>
      </button>
    </nav>
  );
}
