"use client";

import { ReactNode, useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { getViewAsStatusSync, stopViewAs } from "@/lib/admin-api";
import { AlertTriangle, LogOut, Clock, ShieldAlert, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { HelpCenterFAB } from "@/components/ui/HelpCenterFAB";
import { useInactivityTimeout } from "@/hooks/useInactivityTimeout";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [viewAs, setViewAs] = useState<{ active: boolean; agent_label?: string; agent_uuid?: string }>({ active: false });
  const [user, setUser] = useState<any>(null);
  
  const {
    showWarning: showTimeoutWarning,
    timeLeft,
    isRenewing,
    handleRenewSession,
    handleLogout
  } = useInactivityTimeout({
    timeoutSeconds: 60 * 60, // 1 hour inactivity
    warningSeconds: 2 * 60   // 2 minutes warning
  });

  useEffect(() => {
    setViewAs(getViewAsStatusSync());
  }, []);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  const handleExit = async () => {
    await stopViewAs();
    window.location.reload();
  };


  return (
    <div className="flex h-screen overflow-hidden bg-transparent transition-colors duration-500 relative">
      <Sidebar />
      
      <div className="flex flex-1 flex-col overflow-hidden w-full min-w-0 relative transition-all duration-500 ease-in-out">
        {viewAs.active && (
          <div className="bg-gradient-to-r from-amber-600/90 via-amber-700/90 to-amber-900/90 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between text-white shadow-lg backdrop-blur-sm z-30 animate-pulse-subtle">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-300 animate-bounce" />
              <span>
                You are currently viewing data as Network Agent: <strong className="text-amber-200">{viewAs.agent_label || "Unknown Agent"}</strong> <span className="text-xs text-white/70">({viewAs.agent_uuid})</span>
              </span>
            </div>
            <button
              onClick={handleExit}
              className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/20 rounded-md text-xs font-semibold tracking-wide transition-all shadow-sm shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              Exit View Mode
            </button>
          </div>
        )}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-transparent p-4 md:p-6 transition-all duration-500 ease-in-out w-full relative">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Premium Session Timeout Warning Modal */}
      <Modal isOpen={showTimeoutWarning} onClose={() => {}} title="Session Security Alert">
        <div className="space-y-5 text-xs text-slate-300">
          <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="font-medium text-slate-200">
              For your security, your active dashboard session will automatically expire due to inactivity.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center p-6 bg-slate-900/40 border border-white/5 rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full" />
            <Clock className="w-8 h-8 text-blue-400 mb-2 relative animate-pulse" />
            <span className="text-[10px] text-slate-500 uppercase tracking-widest relative">Remaining Time</span>
            <span className="text-3xl font-black text-white font-mono tracking-tight mt-1 relative">
              {formatCountdown(timeLeft)}
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
            >
              Logout Now
            </button>
            <button
              type="button"
              onClick={handleRenewSession}
              disabled={isRenewing}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {isRenewing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Keep Me Logged In
            </button>
          </div>
        </div>
      </Modal>

      {/* Global Help Center Drawer */}
      <HelpCenterFAB />
    </div>
  );
}
