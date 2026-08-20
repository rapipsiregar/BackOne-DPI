"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Activity } from "lucide-react";

interface SidebarSiteSelectorProps {
  user: { role?: string } | null;
  selectedSite: string;
  handleSiteSelect: (val: string) => void;
}

export default function SidebarSiteSelector({
  user,
  selectedSite,
  handleSiteSelect,
}: SidebarSiteSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user || !['SUPER_ADMIN', 'EXECUTIVE', 'SOC_ANALYST', 'ENGINEER'].includes(user.role || '')) {
    return null;
  }

  const getSiteLabel = (uuid: string) => {
    if (uuid === '6681452d_9cae_4ff4_8ae8_0d504774265e') return 'SIAB';
    if (uuid === '1959bb55_045b_47c7_bbdd_f33b7db197b9') return 'Office';
    return 'SIAB';
  };

  return (
    <div className="relative w-full px-2" ref={ref} style={{ fontFamily: "'Times New Roman', Times, serif" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between gap-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] px-3.5 py-2.5 rounded-xl transition-all duration-200 text-left cursor-pointer backdrop-blur-md",
          isOpen && "border-blue-500/30 ring-1 ring-blue-500/20"
        )}
      >
        <div className="flex items-center gap-3">
          <Activity className="h-4 w-4 text-slate-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 leading-none mb-1">
              ACTIVE SITE
            </span>
            <span className="text-xs font-medium text-slate-300 leading-none">
              {getSiteLabel(selectedSite)}
            </span>
          </div>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-slate-600 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      <div
        className={cn(
          "absolute top-full left-2 right-2 mt-1.5 rounded-xl border border-white/10 bg-slate-950/85 backdrop-blur-xl p-1.5 shadow-2xl z-50 origin-top transition-all duration-300 ease-out",
          isOpen
            ? "opacity-100 scale-100 pointer-events-auto translate-y-0"
            : "opacity-0 scale-95 pointer-events-none -translate-y-2"
        )}
      >
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => {
              handleSiteSelect('6681452d_9cae_4ff4_8ae8_0d504774265e');
              setIsOpen(false);
            }}
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
            onClick={() => {
              handleSiteSelect('1959bb55_045b_47c7_bbdd_f33b7db197b9');
              setIsOpen(false);
            }}
            className={cn(
              "w-full rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors",
              selectedSite === '1959bb55_045b_47c7_bbdd_f33b7db197b9'
                ? "bg-primary/20 text-white font-medium"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
          >
            Office
          </button>
        </div>
      </div>
    </div>
  );
}
