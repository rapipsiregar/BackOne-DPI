"use client";

import { useState, useEffect } from "react";
import { Eye, ArrowLeft, Loader2 } from "lucide-react";
import { getViewAsStatusSync, stopViewAs, type ViewAsStatus } from "@/lib/admin-api";
import { useRouter } from "next/navigation";

export default function ViewAsAgentBanner() {
  const router = useRouter();
  const [status, setStatus] = useState<ViewAsStatus>({ active: false });
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Baca dari localStorage (sync) karena token disimpan di sana
    const current = getViewAsStatusSync();
    setStatus(current);
  }, []);

  if (!status.active) return null;

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      await stopViewAs(); // Hapus dari localStorage
      setStatus({ active: false });
      // Force reload agar semua data di-refresh tanpa view-as filter
      window.location.reload();
    } catch {
      setIsLeaving(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-amber-900/40 via-amber-800/30 to-amber-900/40 backdrop-blur-md border-b border-amber-500/20 px-4 py-2 flex items-center justify-between z-40">
      <div className="flex items-center gap-2 text-amber-200">
        <Eye className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <span className="text-sm">
          Melihat sebagai:{" "}
          <span className="font-semibold text-amber-100">{status.agent_label}</span>
          <span className="text-amber-400 font-mono text-xs ml-1">({status.agent_uuid})</span>
        </span>
      </div>
      <button
        onClick={handleLeave}
        disabled={isLeaving}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-700/50 hover:bg-amber-700 border border-amber-600 text-amber-100 text-xs font-medium transition-colors disabled:opacity-50"
      >
        {isLeaving ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <ArrowLeft className="w-3.5 h-3.5" />
        )}
        Return to Admin
      </button>
    </div>
  );
}

