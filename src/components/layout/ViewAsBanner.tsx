"use client";

import { AlertTriangle, LogOut } from "lucide-react";
import { stopViewAs } from "@/lib/admin-api";

interface ViewAsBannerProps {
  viewAs: {
    active: boolean;
    agent_label?: string;
    agent_uuid?: string;
    view_as_type?: string;
    user_name?: string;
    user_role?: string;
  };
}

export function ViewAsBanner({ viewAs }: ViewAsBannerProps) {
  if (!viewAs.active) return null;

  const handleExit = async () => {
    await stopViewAs();
    window.location.reload();
  };

  const viewAsType = viewAs.view_as_type;
  const agentLabel = viewAs.agent_label || viewAs.agent_uuid || 'Unknown';
  const agentUuid = viewAs.agent_uuid || '';

  return (
    <div className="bg-gradient-to-r from-amber-600/90 via-amber-700/90 to-amber-900/90 border-b border-amber-500/30 px-4 sm:px-6 py-2.5 flex items-center justify-between text-white shadow-lg backdrop-blur-sm z-30">
      <div className="flex items-center gap-2 text-xs sm:text-sm font-medium min-w-0">
        <AlertTriangle className="w-4 h-4 text-amber-300 animate-bounce shrink-0" />
        <span className="leading-relaxed truncate">
          {viewAsType === 'user' ? (
            <>
              <span className="text-amber-100/80">View-As Mode</span>
              {' — '}Viewing as <strong className="text-amber-200">{viewAs.user_name || 'Unknown'}</strong>{' '}
              <span className="text-xs font-normal text-white/70 bg-amber-950/40 px-1.5 py-0.5 rounded">
                {(viewAs.user_role || '').replace(/_/g, ' ')}
              </span>
              {agentLabel && agentLabel !== agentUuid && (
                <> via Agent <strong className="text-amber-200">{agentLabel}</strong></>
              )}
            </>
          ) : (
            <>
              <span className="text-amber-100/80">View-As Mode</span>
              {' — '}Viewing as Agent <strong className="text-amber-200">{agentLabel}</strong>
            </>
          )}
        </span>
      </div>
      <button
        type="button"
        onClick={handleExit}
        className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/20 rounded-md text-xs font-semibold tracking-wide transition-all shadow-sm shrink-0 ml-2"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Exit View Mode</span>
        <span className="sm:hidden">Exit</span>
      </button>
    </div>
  );
}
