"use client";

import { Modal } from "@/components/ui/Modal";
import { ShieldAlert, Clock, Loader2 } from "lucide-react";

interface SessionTimeoutModalProps {
  showWarning: boolean;
  timeLeft: number;
  isRenewing: boolean;
  onRenew: () => void;
  onLogout: () => void;
}

export function SessionTimeoutModal({
  showWarning,
  timeLeft,
  isRenewing,
  onRenew,
  onLogout
}: SessionTimeoutModalProps) {
  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  return (
    <Modal isOpen={showWarning} onClose={() => {}} title="Session Security Alert">
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
            onClick={onLogout}
            className="px-4 py-2 text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
          >
            Logout Now
          </button>
          <button
            type="button"
            onClick={onRenew}
            disabled={isRenewing}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {isRenewing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Keep Me Logged In
          </button>
        </div>
      </div>
    </Modal>
  );
}
