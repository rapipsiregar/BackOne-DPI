"use client";

import React, { useState } from "react";
import { MapPin, AlertTriangle, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Agent } from "@/lib/actions/agentsCore";

interface UnregisteredAgentsPanelProps {
  unregisteredAgents: Agent[];
  onEditLocation: (agentUuid: string, label: string) => void;
  role?: string | null;
  isDark: boolean;
}

export function UnregisteredAgentsPanel({
  unregisteredAgents,
  onEditLocation,
  role,
  isDark,
}: UnregisteredAgentsPanelProps) {
  const [panelOpen, setPanelOpen] = useState(true);

  if (unregisteredAgents.length === 0) return null;

  return (
    <div className={`mt-3 rounded-xl border transition-colors duration-200 ${
      isDark
        ? "border-amber-500/20 bg-amber-500/5"
        : "border-blue-200 bg-blue-50"
    }`}>
      <button
        onClick={() => setPanelOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className={`h-3.5 w-3.5 shrink-0 ${isDark ? "text-amber-500" : "text-blue-500"}`} />
          <span className={`text-xs font-semibold ${
            isDark ? "text-amber-400" : "text-blue-700"
          }`}>
            {unregisteredAgents.length} Agent{unregisteredAgents.length > 1 ? "s" : ""} Without Coordinates{role === 'SUPER_ADMIN' || role === 'TENANT_ADMIN' ? " — Click to Configure" : ""}
          </span>
        </div>
        {panelOpen
          ? <ChevronUp className={`h-3.5 w-3.5 ${isDark ? "text-amber-500" : "text-blue-400"}`} />
          : <ChevronDown className={`h-3.5 w-3.5 ${isDark ? "text-amber-500" : "text-blue-400"}`} />}
      </button>

      {panelOpen && (
        <div className="flex flex-wrap gap-2 px-4 pb-3 pt-0.5">
          {unregisteredAgents.map(agent => {
            const uuid = agent.uuid || agent.serial || "";
            const isOnline = agent.activated;
            const isWritable = role === 'SUPER_ADMIN' || role === 'TENANT_ADMIN';
            return (
              <button
                key={uuid}
                onClick={isWritable ? () => onEditLocation(uuid, agent.label || uuid) : undefined}
                disabled={!isWritable}
                className={`group flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                  isDark
                    ? isWritable
                      ? "border-white/10 bg-slate-900/60 text-slate-300 hover:border-primary/40 hover:bg-primary/10 hover:text-primary cursor-pointer"
                      : "border-white/5 bg-slate-900/40 text-slate-500 cursor-default"
                    : isWritable
                      ? "border-blue-200 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                      : "border-slate-200 bg-slate-50 text-slate-400 cursor-default"
                }`}
              >
                <MapPin className={`h-3.5 w-3.5 shrink-0 ${
                  isOnline ? "text-emerald-500 animate-pulse" : "text-red-400"
                }`} />
                <span className="max-w-[160px] truncate" title={agent.label}>{agent.label}</span>
                <span className={`font-mono text-[10px] truncate max-w-[80px] ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`} title={uuid}>{uuid}</span>
                {isWritable && (
                  <Plus className={`h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                    isDark ? "" : "text-blue-500"
                  }`} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
