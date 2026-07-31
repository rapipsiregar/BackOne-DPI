// src/components/layout/SidebarProfile.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { User as UserIcon, LogOut, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { SafeImage } from "../ui/SafeImage";
import { getViewAsStatusSync } from "@/lib/admin-api";

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  EXECUTIVE: 'Executive',
  TENANT_ADMIN: 'Tenant Admin',
  SOC_ANALYST: 'SOC Analyst',
  ENGINEER: 'Engineer',
  AGENT_VIEWER: 'Agent Viewer',
  // Company-facing roles — client/customer accounts
  COMPANY_ADMIN: 'Company Admin',
  COMPANY_OPERATOR: 'Company Operator',
  COMPANY_VIEWER: 'Company Viewer',
};

const getRoleDisplayName = (role?: string) => {
  if (!role) return 'Standard User';
  return ROLE_DISPLAY_NAMES[role] || 'Standard User';
};

interface ProfileProps {
  user: any;
  onOpenSettings: () => void;
}

export default function SidebarProfile({ user, onOpenSettings }: ProfileProps) {
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [viewAsStatus, setViewAsStatus] = useState<any | null>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Cek apakah sedang dalam mode View-As untuk menampilkan label yang benar
    const status = getViewAsStatusSync();
    setViewAsStatus(status);
  }, []);

  // Jika dalam View-As mode, gunakan label dari view-as (bukan role dari server yang jadi AGENT_VIEWER)
  const isViewAsMode = viewAsStatus?.active;

  // Bangun label yang ditampilkan di sidebar bawah profil
  const roleLabel = (() => {
    if (!isViewAsMode) return getRoleDisplayName(user?.role);
    
    const viewAsType = viewAsStatus?.view_as_type;
    if (viewAsType === 'user') {
      const userName = viewAsStatus?.user_name || 'Unknown';
      const userRole = viewAsStatus?.user_role || '';
      const roleShort = ROLE_DISPLAY_NAMES[userRole] || userRole.replace(/_/g, ' ');
      return `Viewing as: ${userName} (${roleShort})`;
    }
    // Direct agent view-as: tampilkan label agent
    const agentLabel = viewAsStatus?.agent_label || viewAsStatus?.agent_uuid || 'Unknown';
    return `Viewing Agent: ${agentLabel}`;
  })();

  const initial = user?.account_name
    ? user.account_name.charAt(0)
    : (user?.username ? user.username.charAt(0) : 'U');

  return (
    <div className="relative flex-1 min-w-0" ref={accountDropdownRef}>
      <button
        onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
        className="flex w-full items-center gap-3 rounded-xl p-2 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-blue-400 overflow-hidden">
          {user?.profile_picture ? (
            <SafeImage src={`/api/uploads/${user.profile_picture}`} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="font-bold text-white uppercase text-xs">
              {initial}
            </span>
          )}
        </div>
        <div className="flex flex-col items-start overflow-hidden text-left min-w-0 flex-1">
          <span className="text-sm font-semibold text-foreground truncate w-full">
            {user?.account_name || user?.username || 'Loading...'}
          </span>
          <span className={`text-[10px] truncate w-full ${isViewAsMode ? 'text-amber-400' : 'text-primary'}`}>
            {isViewAsMode && <Eye className="inline w-2.5 h-2.5 mr-0.5" />}
            {roleLabel}
          </span>
        </div>
      </button>

      {isAccountDropdownOpen && (
        <div className="absolute bottom-full left-0 mb-3 w-[232px] md:bottom-0 md:left-full md:right-auto md:ml-4 md:mb-0 md:w-60 rounded-2xl border border-slate-700/90 bg-[#0F172A] p-3 shadow-[0_10px_38px_-10px_rgba(0,0,0,0.9)] z-50 animate-fade-in ring-1 ring-white/10">
          <div className="flex flex-col items-center justify-center p-3 mb-2 border-b border-white/10 bg-white/[0.02] rounded-xl text-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-blue-400 overflow-hidden mb-2 shadow-md">
              {user?.profile_picture ? (
                <SafeImage src={`/api/uploads/${user.profile_picture}`} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-white uppercase text-lg">
                  {initial}
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-slate-100 text-center break-words w-full leading-tight">
              {user?.account_name || user?.username || 'Loading...'}
            </span>
            {isViewAsMode ? (
              <span className="text-[11px] text-amber-400 mt-1 text-center font-medium flex items-center gap-1 justify-center">
                <Eye className="w-3 h-3 shrink-0" />
                {(() => {
                  const vt = viewAsStatus?.view_as_type;
                  if (vt === 'user') {
                    const un = viewAsStatus?.user_name || 'Unknown';
                    const ur = ROLE_DISPLAY_NAMES[viewAsStatus?.user_role] || viewAsStatus?.user_role?.replace(/_/g, ' ') || '';
                    return `${un} (${ur})`;
                  }
                  return viewAsStatus?.agent_label || viewAsStatus?.agent_uuid || 'Unknown';
                })()}
              </span>
            ) : (
              <span className="text-[11px] text-primary mt-1 text-center font-semibold">
                {getRoleDisplayName(user?.role)}
              </span>
            )}
          </div>

          {!isViewAsMode && (
            <button
              onClick={() => {
                setIsAccountDropdownOpen(false);
                onOpenSettings();
              }}
              className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all whitespace-nowrap"
            >
              <UserIcon className="h-4 w-4 text-primary shrink-0" /> Account Settings
            </button>
          )}

          <div className="h-px bg-white/10 my-1.5 mx-1" />
          <button
            onClick={async () => {
              try {
                await fetch('/api/auth/logout', { method: 'POST' });
              } catch (e) {
                console.error('Logout error:', e);
              }
              if (typeof window !== 'undefined') {
                localStorage.removeItem('backone_view_as');
              }
              window.location.href = "/login";
            }}
            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/15 transition-all whitespace-nowrap"
          >
            <LogOut className="h-4 w-4 text-red-400 shrink-0" /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
