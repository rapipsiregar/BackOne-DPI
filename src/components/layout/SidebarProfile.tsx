// src/components/layout/SidebarProfile.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { User as UserIcon, Sun, Moon, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  TENANT_ADMIN: 'Tenant Admin',
  SOC_ANALYST: 'SOC Analyst',
  ENGINEER: 'Engineer',
  AGENT_VIEWER: 'Agent Viewer',
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
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roleLabel = getRoleDisplayName(user?.role);
  const initial = user?.account_name ? user.account_name.charAt(0) : (user?.username ? user.username.charAt(0) : (user?.role === 'SUPER_ADMIN' ? 'A' : 'V'));

  return (
    <div className="relative flex-1 min-w-0" ref={accountDropdownRef}>
      <button
        onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
        className="flex w-full items-center gap-3 rounded-xl p-2 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-blue-400 overflow-hidden">
          {user?.profile_picture ? (
            <img src={`/api/uploads/${user.profile_picture}`} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="font-bold text-white uppercase text-xs">
              {initial}
            </span>
          )}
        </div>
        <div className="flex flex-col items-start overflow-hidden text-left min-w-0 flex-1">
          <span className="text-sm font-semibold text-foreground truncate w-full">{user?.account_name || user?.username || 'Loading...'}</span>
          <span className="text-[10px] text-primary truncate w-full">{roleLabel}</span>
        </div>
      </button>

      {isAccountDropdownOpen && (
        <div className="absolute bottom-0 left-full ml-4 w-56 rounded-xl border border-border bg-card/95 backdrop-blur-xl p-2 shadow-2xl z-50 animate-fade-in">
          <div className="flex flex-col items-center justify-center p-3 mb-2 border-b border-border/50">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-blue-400 overflow-hidden mb-2">
              {user?.profile_picture ? (
                <img src={`/api/uploads/${user.profile_picture}`} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-white uppercase text-lg">
                  {initial}
                </span>
              )}
            </div>
            <span className="text-sm font-bold text-foreground text-center break-words w-full leading-tight">{user?.account_name || user?.username || 'Loading...'}</span>
            <span className="text-xs text-primary mt-1 text-center font-medium">{roleLabel}</span>
          </div>

          <button
            onClick={() => {
              setIsAccountDropdownOpen(false);
              onOpenSettings();
            }}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <UserIcon className="h-4 w-4" /> Account Settings
          </button>
          <button
            onClick={() => {
              setTheme(theme === 'dark' ? 'light' : 'dark');
              setIsAccountDropdownOpen(false);
            }}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
            <span className="truncate">{theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
          </button>
          <div className="h-px bg-border/50 my-1 mx-2" />
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              router.push('/login');
              router.refresh();
            }}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
