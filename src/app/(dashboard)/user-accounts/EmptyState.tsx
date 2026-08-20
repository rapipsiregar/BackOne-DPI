"use client";

import { Users, Plus } from "lucide-react";

interface EmptyStateProps {
  role: string | null;
  onAddUserClick: (companyName: string) => void;
}

export function EmptyState({ role, onAddUserClick }: EmptyStateProps) {
  return (
    <div className="max-w-md mx-auto py-12 px-6">
      <div className="relative overflow-hidden bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-3xl p-8 text-center shadow-2xl shadow-black/50">
        {/* Ambient glow highlight */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5 text-amber-400 shadow-lg shadow-amber-500/5">
          <Users className="w-8 h-8" />
        </div>
        
        <h3 className="relative text-white font-bold text-lg mb-1.5">No Company Accounts</h3>
        <p className="relative text-sm text-slate-400 mb-6 max-w-xs mx-auto">
          Create the first company tenant admin account to get started.
        </p>
        
        {role === "SUPER_ADMIN" && (
          <button
            type="button"
            onClick={() => onAddUserClick("")}
            className="relative inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/10 hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Company Admin
          </button>
        )}
      </div>
    </div>
  );
}
